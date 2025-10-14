import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';

interface SaleService {
  serviceId: string;
  quantity: number;
  isChild: boolean;
  isCombined: boolean;
}

interface DiscountCalculation {
  type: string;
  amount: number;
  description: string;
}

export const createSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      services, // Array of SaleService
      serviceIds, // Optional: Array<string> (frontend simplified payload)
      staffIds, // Array of staff IDs
      notes,
      paymentMethod = 'CASH',
      ownShampooDiscount = false
    } = req.body;

    const normalizedServices: any[] = Array.isArray(services) && services.length > 0
      ? services
      : Array.isArray(serviceIds) && serviceIds.length > 0
        ? (serviceIds as string[]).map((sid: string) => ({ serviceId: sid, quantity: 1, isChild: false, isCombined: false }))
        : [];

    if (!customerId || normalizedServices.length === 0) {
      res.status(400).json({ error: 'Customer ID and services are required' });
      return;
    }

    // Get customer data
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: {
          select: { saleDate: true },
          orderBy: { saleDate: 'desc' }
        }
      }
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Get service details
    const serviceIdsToFetch = normalizedServices.map((s: SaleService) => s.serviceId);
    const serviceDetails = await prisma.service.findMany({
      where: { id: { in: serviceIdsToFetch }, isActive: true }
    });

    if (serviceDetails.length !== serviceIdsToFetch.length) {
      res.status(400).json({ error: 'One or more services not found or inactive' });
      return;
    }

    // Calculate total amount and prepare sale services
    let totalAmount = 0;
    const saleServices: any[] = [];

    for (const service of normalizedServices) {
      const serviceDetail = serviceDetails.find(s => s.id === service.serviceId);
      if (!serviceDetail) continue;

      let unitPrice = 0;

      if (service.isChild) {
        unitPrice = service.isCombined
          ? Number(serviceDetail.childCombinedPrice || serviceDetail.childPrice || serviceDetail.singlePrice)
          : Number(serviceDetail.childPrice || serviceDetail.singlePrice);
      } else {
        unitPrice = service.isCombined
          ? Number(serviceDetail.combinedPrice || serviceDetail.singlePrice)
          : Number(serviceDetail.singlePrice);
      }

      const lineTotal = unitPrice * service.quantity;
      totalAmount += lineTotal;

      saleServices.push({
        serviceId: service.serviceId,
        quantity: service.quantity,
        unitPrice,
        totalPrice: lineTotal,
        isChild: service.isChild,
        isCombined: service.isCombined
      });
    }

    // Calculate discounts
    const discounts = await calculateDiscounts(customer, normalizedServices, serviceDetails, totalAmount, ownShampooDiscount);
    const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
    const finalAmount = Math.max(0, totalAmount - totalDiscountAmount);

    // Check if birth month discount was applied
    const birthMonthDiscount = discounts.some(d => d.type === 'BIRTHDAY_MONTH');

    // Calculate loyalty points (1 point per 1000 RWF spent)
    const loyaltyPointsEarned = Math.floor(finalAmount / 1000);

    // Create sale in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          customerId,
          totalAmount,
          discountAmount: totalDiscountAmount,
          finalAmount,
          loyaltyPointsEarned,
          notes,
          paymentMethod: paymentMethod as any,
          ownShampooDiscount,
          birthMonthDiscount,
          createdById: req.user!.id
        }
      });

      // Create sale services
      await tx.saleService.createMany({
        data: saleServices.map(vs => ({
          saleId: sale.id,
          ...vs
        }))
      });

      // Create sale staff relationships
      if (staffIds && Array.isArray(staffIds) && staffIds.length > 0) {
        await tx.saleStaff.createMany({
          data: staffIds.map((staffId: string) => ({
            saleId: sale.id,
            staffId
          }))
        });
      }

      // Create discount records
      for (const discount of discounts) {
        let discountRule = await tx.discountRule.findFirst({
          where: { type: discount.type as any, isActive: true }
        });

        if (!discountRule) {
          // Create discount rule if it doesn't exist
          discountRule = await tx.discountRule.create({
            data: {
              name: discount.description,
              type: discount.type as any,
              value: discount.type === 'SERVICE_COMBO' ? 2000 : 20,
              isPercentage: discount.type !== 'SERVICE_COMBO',
              description: discount.description
            }
          });
        }

        await tx.saleDiscount.create({
          data: {
            saleId: sale.id,
            discountRuleId: discountRule.id,
            discountAmount: discount.amount
          }
        });

        // Record customer discount usage
        await tx.customerDiscount.create({
          data: {
            customerId,
            discountRuleId: discountRule.id,
            discountAmount: discount.amount
          }
        });
      }

      // Update customer statistics
      await tx.customer.update({
        where: { id: customerId },
        data: {
          saleCount: { increment: 1 },
          loyaltyPoints: { increment: loyaltyPointsEarned },
          totalSpent: { increment: finalAmount },
          lastSale: new Date()
        }
      });

      return sale;
    });

    // Fetch complete sale data to return
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        services: {
          include: {
            service: true
          }
        },
        staff: {
          include: {
            staff: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        discounts: {
          include: {
            discountRule: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: completeSale,
      message: 'Sale recorded successfully'
    });

  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function calculateDiscounts(
  customer: any,
  services: SaleService[],
  serviceDetails: any[],
  totalAmount: number,
  ownShampooDiscount: boolean = false
): Promise<DiscountCalculation[]> {
  const discounts: DiscountCalculation[] = [];
  const currentMonth = new Date().getMonth() + 1;

  // 1. Sixth sale discount (20%)
  const newSaleCount = customer.saleCount + 1;
  if (newSaleCount % 6 === 0) {
    discounts.push({
      type: 'SIXTH_VISIT',
      amount: Math.round(totalAmount * 0.2),
      description: '6th Sale Discount (20%)'
    });
  }

  // 2. Birthday month discount (20%)
  if (customer.birthMonth === currentMonth) {
    // Check if customer hasn't used birthday discount this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const existingBirthdayDiscount = await prisma.customerDiscount.findFirst({
      where: {
        customerId: customer.id,
        usedAt: { gte: thisMonth },
        discountRule: {
          type: 'BIRTHDAY_MONTH'
        }
      }
    });

    if (!existingBirthdayDiscount) {
      discounts.push({
        type: 'BIRTHDAY_MONTH',
        amount: Math.round(totalAmount * 0.2),
        description: 'Birthday Month Discount (20%)'
      });
    }
  }

  // 3. Service combination discount (shampoo + any other service = 2000 RWF off)
  const hasShampoo = services.some(s => {
    const service = serviceDetails.find(sd => sd.id === s.serviceId);
    return service && service.name.toLowerCase().includes('shampoo');
  });

  const hasOtherServices = services.some(s => {
    const service = serviceDetails.find(sd => sd.id === s.serviceId);
    return service && !service.name.toLowerCase().includes('shampoo');
  });

  if (hasShampoo && hasOtherServices && totalAmount >= 2000) {
    discounts.push({
      type: 'SERVICE_COMBO',
      amount: 2000,
      description: 'Shampoo + Service Combo Discount'
    });
  }

  // 4. Own shampoo discount (1000 RWF off when customer brings own shampoo)
  if (ownShampooDiscount && totalAmount >= 1000) {
    discounts.push({
      type: 'BRING_OWN_PRODUCT',
      amount: 1000,
      description: 'Bring Your Own Shampoo Discount'
    });
  }

  return discounts;
}

export const getAllSales = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', customerId, staffId, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    // If user is STAFF, only show their own sales
    if (req.user?.role === 'STAFF') {
      whereClause.staff = {
        some: { staffId: req.user.id }
      };
    } else {
      // For ADMIN/MANAGER, allow filtering by customerId and staffId
      if (customerId) {
        whereClause.customerId = customerId;
      }

      if (staffId) {
        whereClause.staff = {
          some: { staffId }
        };
      }
    }

    if (startDate || endDate) {
      whereClause.saleDate = {};
      if (startDate) {
        whereClause.saleDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.saleDate.lte = new Date(endDate as string);
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { saleDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          },
          staff: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          discounts: {
            include: {
              discountRule: true
            }
          }
        }
      }),
      prisma.sale.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        services: {
          include: {
            service: true
          }
        },
        staff: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        discounts: {
          include: {
            discountRule: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { services, staffIds, notes, isCompleted } = req.body;

    const existingSale = await prisma.sale.findUnique({ where: { id } });
    if (!existingSale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update services if provided
      if (Array.isArray(services)) {
        // Delete existing sale services and recalc totals
        await tx.saleService.deleteMany({ where: { saleId: id } });

        if (services.length > 0) {
          const serviceIds = services.map((s: any) => s.serviceId);
          const serviceDetails = await tx.service.findMany({ where: { id: { in: serviceIds } } });

          let totalAmount = 0;
          const saleServices: any[] = [];

          for (const service of services) {
            const detail = serviceDetails.find(s => s.id === service.serviceId);
            if (!detail) continue;

            let unitPrice = 0;
            if (service.isChild) {
              unitPrice = service.isCombined
                ? Number(detail.childCombinedPrice || detail.childPrice || detail.singlePrice)
                : Number(detail.childPrice || detail.singlePrice);
            } else {
              unitPrice = service.isCombined
                ? Number(detail.combinedPrice || detail.singlePrice)
                : Number(detail.singlePrice);
            }

            const lineTotal = unitPrice * (service.quantity || 1);
            totalAmount += lineTotal;
            saleServices.push({
              saleId: id,
              serviceId: service.serviceId,
              quantity: service.quantity || 1,
              unitPrice,
              totalPrice: lineTotal,
              isChild: !!service.isChild,
              isCombined: !!service.isCombined
            });
          }

          await tx.saleService.createMany({ data: saleServices });

          // Recalculate discounts
          const customer = await tx.customer.findUnique({ where: { id: existingSale.customerId } });
          const discounts = await calculateDiscounts(customer as any, services, serviceDetails as any[], totalAmount);
          const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
          const finalAmount = Math.max(0, totalAmount - totalDiscountAmount);
          const loyaltyPointsEarned = Math.floor(finalAmount / 1000);

          await tx.sale.update({
            where: { id },
            data: {
              totalAmount,
              discountAmount: totalDiscountAmount,
              finalAmount,
              loyaltyPointsEarned
            }
          });

          // Refresh discounts: delete and recreate
          await tx.saleDiscount.deleteMany({ where: { saleId: id } });
          for (const discount of discounts) {
            let discountRule = await tx.discountRule.findFirst({ where: { type: discount.type as any, isActive: true } });
            if (!discountRule) {
              discountRule = await tx.discountRule.create({
                data: {
                  name: discount.description,
                  type: discount.type as any,
                  value: discount.type === 'SERVICE_COMBO' ? 2000 : 20,
                  isPercentage: discount.type !== 'SERVICE_COMBO',
                  description: discount.description
                }
              });
            }
            await tx.saleDiscount.create({
              data: { saleId: id, discountRuleId: discountRule.id, discountAmount: discount.amount }
            });
          }
        }
      }

      // Update staff if provided
      if (Array.isArray(staffIds)) {
        await tx.saleStaff.deleteMany({ where: { saleId: id } });
        if (staffIds.length > 0) {
          await tx.saleStaff.createMany({ data: staffIds.map((sid: string) => ({ saleId: id, staffId: sid })) });
        }
      }

      // Update basic fields
      const updateData: any = {};
      if (notes !== undefined) updateData.notes = notes;
      if (isCompleted !== undefined) updateData.isCompleted = !!isCompleted;
      if (Object.keys(updateData).length > 0) {
        await tx.sale.update({ where: { id }, data: updateData });
      }
    });

    const updated = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        services: { include: { service: true } },
        staff: { include: { staff: { select: { id: true, name: true } } } },
        discounts: { include: { discountRule: true } }
      }
    });

    res.json({ success: true, data: updated, message: 'Sale updated successfully' });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existingSale = await prisma.sale.findUnique({ where: { id } });
    if (!existingSale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.saleDiscount.deleteMany({ where: { saleId: id } });
      await tx.saleStaff.deleteMany({ where: { saleId: id } });
      await tx.saleService.deleteMany({ where: { saleId: id } });
      await tx.sale.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.update({ where: { id }, data: { isCompleted: true } });
    res.json({ success: true, data: sale, message: 'Sale marked as completed' });
  } catch (error) {
    console.error('Complete sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSalesSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    // If user is STAFF, only show their own sales summary
    if (req.user?.role === 'STAFF') {
      where.staff = {
        some: { staffId: req.user.id }
      };
    }

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = new Date(startDate as string);
      if (endDate) where.saleDate.lte = new Date(endDate as string);
    }

    const [count, agg] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.aggregate({ where, _sum: { discountAmount: true, finalAmount: true } })
    ]);

    const totalRevenue = Number(agg._sum.finalAmount || 0);
    const totalDiscounts = Number(agg._sum.discountAmount || 0);
    const averageSaleValue = count > 0 ? totalRevenue / count : 0;

    res.json({
      success: true,
      data: {
        totalSales: count,
        totalRevenue,
        totalDiscounts,
        averageSaleValue
      }
    });
  } catch (error) {
    console.error('Get sales summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSalesByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { customerId },
        skip,
        take: limitNum,
        orderBy: { saleDate: 'desc' },
        include: {
          services: { include: { service: true } },
          staff: { include: { staff: { select: { id: true, name: true } } } }
        }
      }),
      prisma.sale.count({ where: { customerId } })
    ]);

    res.json({
      success: true,
      data: sales,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get sales by customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};