import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';

interface SaleService {
  serviceId: string;
  quantity: number;
  isChild: boolean;
  isCombined: boolean;
  addShampoo?: boolean;
}

interface DiscountCalculation {
  type: string;
  amount: number;
  description: string;
}

export const createSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('🔍 DEBUGGING SALE CREATION - Full request body:', JSON.stringify(req.body, null, 2));

    const {
      customerId,
      services, // Array of SaleService
      serviceIds, // Optional: Array<string> (frontend simplified payload)
      serviceShampooOptions, // Object mapping serviceId to shampoo preference
      staffIds, // Array of staff IDs
      customStaffNames, // Array of custom staff names
      notes,
      paymentMethod = 'CASH', // Legacy single payment method
      payments, // New: Array of payment methods with amounts
      ownShampooDiscount = false,
      addShampoo = false, // Legacy global shampoo option
      manualDiscountAmount = 0,
      manualDiscountReason
    } = req.body;

    console.log('🔍 DEBUGGING STAFF DATA:', {
      staffIds,
      customStaffNames,
      staffIdsType: typeof staffIds,
      customStaffNamesType: typeof customStaffNames,
      staffIdsLength: Array.isArray(staffIds) ? staffIds.length : 'not array',
      customStaffNamesLength: Array.isArray(customStaffNames) ? customStaffNames.length : 'not array'
    });

    const normalizedServices: any[] = Array.isArray(services) && services.length > 0
      ? services
      : Array.isArray(serviceIds) && serviceIds.length > 0
        ? (serviceIds as string[]).map((sid: string) => ({
            serviceId: sid,
            quantity: 1,
            isChild: false,
            isCombined: false,
            addShampoo: serviceShampooOptions?.[sid] ?? addShampoo // Use individual or fallback to global
          }))
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

      // Determine if shampoo should be added for this service
      const shouldAddShampoo = service.addShampoo || false;

      if (service.isChild) {
        if (shouldAddShampoo && serviceDetail.childCombinedPrice) {
          unitPrice = Number(serviceDetail.childCombinedPrice);
        } else {
          unitPrice = Number(serviceDetail.childPrice || serviceDetail.singlePrice);
        }
      } else {
        if (shouldAddShampoo && serviceDetail.combinedPrice) {
          unitPrice = Number(serviceDetail.combinedPrice);
        } else {
          unitPrice = Number(serviceDetail.singlePrice);
        }
      }

      const lineTotal = unitPrice * service.quantity;
      totalAmount += lineTotal;

      saleServices.push({
        serviceId: service.serviceId,
        quantity: service.quantity,
        unitPrice,
        totalPrice: lineTotal,
        isChild: service.isChild,
        isCombined: shouldAddShampoo,
        addShampoo: shouldAddShampoo
      });
    }

    // Calculate discounts
    const discounts = await calculateDiscounts(customer, normalizedServices, serviceDetails, totalAmount, ownShampooDiscount);

    // Add manual discount if provided
    if (manualDiscountAmount > 0 && manualDiscountReason) {
      discounts.push({
        type: 'MANUAL_DISCOUNT',
        amount: Number(manualDiscountAmount),
        description: manualDiscountReason
      });
    }

    const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
    const finalAmount = Math.max(0, totalAmount - totalDiscountAmount);

    // Process payments - support both old single payment method and new multiple payments
    // Normalize payment methods to ensure consistency
    const validMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
    
    let normalizedPayments: Array<{paymentMethod: string, amount: number}> = [];

    if (Array.isArray(payments) && payments.length > 0) {
      // Use new payments array
      normalizedPayments = payments.map((p: any) => {
        const method = (p.paymentMethod || 'CASH').toUpperCase().trim();
        const normalizedMethod = validMethods.includes(method) ? method : 'CASH';
        
        if (method !== normalizedMethod) {
          console.warn(`⚠️ Invalid payment method "${method}" normalized to "${normalizedMethod}"`);
        }
        
        return {
          paymentMethod: normalizedMethod,
        amount: Number(p.amount || 0)
        };
      });

      // Validate total payment amount matches final amount
      const totalPaymentAmount = normalizedPayments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaymentAmount - finalAmount) > 0.01) {
        res.status(400).json({
          error: `Payment amounts total (${totalPaymentAmount}) must equal final amount (${finalAmount})`
        });
        return;
      }
    } else {
      // Fallback to single payment method for backward compatibility
      const method = (paymentMethod || 'CASH').toUpperCase().trim();
      const normalizedMethod = validMethods.includes(method) ? method : 'CASH';
      
      normalizedPayments = [{
        paymentMethod: normalizedMethod,
        amount: finalAmount
      }];
    }
    
    console.log('💳 Normalized payments for sale:', normalizedPayments.map(p => ({
      method: p.paymentMethod,
      amount: p.amount
    })));

    // Determine primary payment method for legacy field
    const primaryPaymentMethod = normalizedPayments[0]?.paymentMethod || paymentMethod;

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
          paymentMethod: primaryPaymentMethod as any,
          ownShampooDiscount,
          birthMonthDiscount,
          createdById: req.user!.id
        }
      });

      // Create sale services
      await tx.saleService.createMany({
        data: saleServices.map(vs => ({
          saleId: sale.id,
          serviceId: vs.serviceId,
          quantity: vs.quantity,
          unitPrice: vs.unitPrice,
          totalPrice: vs.totalPrice,
          isChild: vs.isChild,
          isCombined: vs.isCombined,
          addShampoo: vs.addShampoo
        }))
      });

      // Create sale payments - normalize payment methods to ensure consistency
      const paymentData = normalizedPayments.map(payment => {
        const method = (payment.paymentMethod || 'CASH').toUpperCase().trim();
        // Validate payment method
        const validMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
        const normalizedMethod = validMethods.includes(method) ? method : 'CASH';
        
        if (method !== normalizedMethod) {
          console.warn(`⚠️ Invalid payment method "${method}" normalized to "${normalizedMethod}"`);
        }
        
        return {
          saleId: sale.id,
          paymentMethod: normalizedMethod as any,
          amount: payment.amount
        };
      });
      
      console.log('💳 Creating sale payments:', paymentData.map(p => ({
        method: p.paymentMethod,
        amount: Number(p.amount)
      })));
      
      const createdPayments = await tx.salePayment.createMany({
        data: paymentData
      });
      
      console.log('✅ Successfully created', createdPayments.count, 'payment entries for sale', sale.id);
      
      // Verify payments were created
      const verifyPayments = await tx.salePayment.findMany({
        where: { saleId: sale.id },
        select: { paymentMethod: true, amount: true }
      });
      console.log('🔍 Verified payments in database:', verifyPayments.map(p => ({
        method: p.paymentMethod,
        amount: Number(p.amount)
      })));

      // Create sale staff relationships for system staff
      if (staffIds && Array.isArray(staffIds) && staffIds.length > 0) {
        await tx.saleStaff.createMany({
          data: staffIds.map((staffId: string) => ({
            saleId: sale.id,
            staffId
          }))
        });
      }

      // Create sale staff relationships for custom staff names
      if (customStaffNames && Array.isArray(customStaffNames) && customStaffNames.length > 0) {
        await tx.saleStaff.createMany({
          data: customStaffNames
            .filter((customName: string | null) => customName != null && customName.trim().length > 0)
            .map((customName: string) => ({
              saleId: sale.id,
              customName: customName.trim()
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
        },
        payments: true
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
  // Only eligible if customer has at least 1 sale (more than 0 sales)
  if (customer.birthMonth === currentMonth && customer.saleCount >= 1) {
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

  // 4. Own product discount (1000 RWF off when customer brings own product)
  if (ownShampooDiscount && totalAmount >= 1000) {
    discounts.push({
      type: 'BRING_OWN_PRODUCT',
      amount: 1000,
      description: 'Bring Your Own Product Discount'
    });
  }

  return discounts;
}

export const getAllSales = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', customerId, staffId, startDate, endDate, search } = req.query;
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

    // Add search functionality for customer names
    if (search) {
      whereClause.customer = {
        fullName: {
          contains: search as string,
          mode: 'insensitive'
        }
      };
    }

    if (startDate || endDate) {
      whereClause.saleDate = {};
      if (startDate) {
        // If only startDate is provided, filter for that specific date
        const startDateObj = new Date(startDate as string);
        startDateObj.setHours(0, 0, 0, 0);
        whereClause.saleDate.gte = startDateObj;

        // If no endDate provided, set endDate to end of the same day
        if (!endDate) {
          const endOfDayObj = new Date(startDate as string);
          endOfDayObj.setHours(23, 59, 59, 999);
          whereClause.saleDate.lte = endOfDayObj;
        }
      }
      if (endDate) {
        // End of the end date (23:59:59.999)
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        whereClause.saleDate.lte = endDateObj;
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
              phone: true,
              saleCount: true
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
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          },
          payments: true
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
    console.error('Error details:', error instanceof Error ? error.message : error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
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
        },
        payments: true
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
    const { services, serviceIds, staffIds, customStaffNames, notes, isCompleted, manualDiscountAmount = 0, manualDiscountReason, ownShampooDiscount = false, payments } = req.body;

    console.log('🔄 UPDATE SALE REQUEST:', {
      saleId: id,
      services: services?.length || 0,
      serviceIds: serviceIds?.length || 0,
      staffIds: staffIds?.length || 0,
      ownShampooDiscount,
      manualDiscountAmount,
      manualDiscountReason,
      payments: payments?.length || 0,
      requestBody: req.body
    });

    const existingSale = await prisma.sale.findUnique({ where: { id } });
    if (!existingSale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update services if provided (handle both serviceIds and services format)
      const servicesToProcess = Array.isArray(services) ? services :
        Array.isArray(serviceIds) ? serviceIds.map((id: string) => ({ serviceId: id, quantity: 1, isChild: false })) : null;

      if (servicesToProcess) {
        console.log('🔧 PROCESSING SERVICES:', { servicesToProcess });
        // Delete existing sale services and recalc totals
        await tx.saleService.deleteMany({ where: { saleId: id } });

        if (servicesToProcess.length > 0) {
          const serviceIdList = servicesToProcess.map((s: any) => s.serviceId || s);
          const serviceDetails = await tx.service.findMany({ where: { id: { in: serviceIdList } } });

          let totalAmount = 0;
          const saleServices: any[] = [];

          for (const service of servicesToProcess) {
            const serviceId = service.serviceId || service;
            const detail = serviceDetails.find(s => s.id === serviceId);
            if (!detail) continue;

            const shouldAddShampoo = service.addShampoo || false;
            let unitPrice = 0;

            if (service.isChild) {
              if (shouldAddShampoo && detail.childCombinedPrice) {
                unitPrice = Number(detail.childCombinedPrice);
              } else {
                unitPrice = Number(detail.childPrice || detail.singlePrice);
              }
            } else {
              if (shouldAddShampoo && detail.combinedPrice) {
                unitPrice = Number(detail.combinedPrice);
              } else {
                unitPrice = Number(detail.singlePrice);
              }
            }

            const lineTotal = unitPrice * (service.quantity || 1);
            totalAmount += lineTotal;
            saleServices.push({
              saleId: id,
              serviceId: serviceId,
              quantity: service.quantity || 1,
              unitPrice,
              totalPrice: lineTotal,
              isChild: !!service.isChild,
              isCombined: shouldAddShampoo,
              addShampoo: shouldAddShampoo
            });
          }

          await tx.saleService.createMany({ data: saleServices });

          // Recalculate discounts
          const customer = await tx.customer.findUnique({ where: { id: existingSale.customerId } });
          console.log('🔍 RECALCULATING DISCOUNTS:', {
            customerId: customer?.id,
            totalAmount,
            ownShampooDiscount,
            servicesCount: servicesToProcess.length
          });
          const discounts = await calculateDiscounts(customer as any, servicesToProcess, serviceDetails as any[], totalAmount, ownShampooDiscount);
          console.log('💰 CALCULATED DISCOUNTS:', discounts);

          // Add manual discount if provided
          if (manualDiscountAmount > 0 && manualDiscountReason) {
            discounts.push({
              type: 'MANUAL_DISCOUNT',
              amount: Number(manualDiscountAmount),
              description: manualDiscountReason
            });
          }

          const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
          const finalAmount = Math.max(0, totalAmount - totalDiscountAmount);
          const loyaltyPointsEarned = Math.floor(finalAmount / 1000);

          // Check if birthday discount is applied
          const birthMonthDiscount = discounts.some(d => d.type === 'BIRTHDAY_MONTH');

          console.log('📊 UPDATING SALE TOTALS:', {
            totalAmount,
            totalDiscountAmount,
            finalAmount,
            loyaltyPointsEarned,
            ownShampooDiscount,
            birthMonthDiscount
          });

          await tx.sale.update({
            where: { id },
            data: {
              totalAmount,
              discountAmount: totalDiscountAmount,
              finalAmount,
              loyaltyPointsEarned,
              ownShampooDiscount,
              birthMonthDiscount
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

      // Update staff if provided (handle both system staff and custom staff)
      if (Array.isArray(staffIds) || Array.isArray(customStaffNames)) {
        await tx.saleStaff.deleteMany({ where: { saleId: id } });

        // Add system staff
        if (Array.isArray(staffIds) && staffIds.length > 0) {
          await tx.saleStaff.createMany({
            data: staffIds.map((sid: string) => ({ saleId: id, staffId: sid }))
          });
        }

        // Add custom staff names
        if (Array.isArray(customStaffNames) && customStaffNames.length > 0) {
          await tx.saleStaff.createMany({
            data: customStaffNames
              .filter((customName: string | null) => customName != null && customName.trim().length > 0)
              .map((customName: string) => ({
                saleId: id,
                customName: customName.trim()
              }))
          });
        }
      }

      // Update payments if provided
      if (Array.isArray(payments)) {
        await tx.salePayment.deleteMany({ where: { saleId: id } });
        if (payments.length > 0) {
          const validMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
          const normalizedPayments = payments.map((payment: any) => {
            const method = (payment.paymentMethod || 'CASH').toUpperCase().trim();
            const normalizedMethod = validMethods.includes(method) ? method : 'CASH';
            
            if (method !== normalizedMethod) {
              console.warn(`⚠️ Invalid payment method "${method}" normalized to "${normalizedMethod}" for sale ${id}`);
            }
            
            return {
            saleId: id,
              paymentMethod: normalizedMethod as any,
            amount: Number(payment.amount)
            };
          });
          
          console.log('💳 Updating sale payments:', normalizedPayments.map(p => ({
            method: p.paymentMethod,
            amount: Number(p.amount)
          })));
          
          await tx.salePayment.createMany({ data: normalizedPayments });
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
        discounts: { include: { discountRule: true } },
        payments: true
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
      await tx.salePayment.deleteMany({ where: { saleId: id } });
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
      if (endDate) {
        // End of the end date (23:59:59.999)
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        where.saleDate.lte = endDateObj;
      }
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

export const getDailyPaymentSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;

    // Use provided date or default to today
    // Handle date string in YYYY-MM-DD format (from date input)
    // IMPORTANT: Parse as UTC to match database storage
    let targetDate: Date;
    if (date) {
      // Parse date string as UTC to avoid timezone issues
      const dateStr = date as string;
      // Create date in UTC: YYYY-MM-DD becomes YYYY-MM-DD 00:00:00 UTC
      targetDate = new Date(dateStr + 'T00:00:00.000Z');
    } else {
      targetDate = new Date();
    }
    
    // Set start and end of day in UTC
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log('📊 Payment Summary Query:', {
      date: date,
      targetDate: targetDate.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      startOfDayLocal: startOfDay.toLocaleString(),
      endOfDayLocal: endOfDay.toLocaleString()
    });

    const whereClause: any = {
      saleDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    };

    // If user is STAFF, only show their own sales
    if (req.user?.role === 'STAFF') {
      whereClause.staff = {
        some: { staffId: req.user.id }
      };
    }

    // Query payments directly by sale date - this is the most reliable approach
    // It gets ALL payments for sales on this date in a single query
    const allDirectPayments = await prisma.salePayment.findMany({
      where: {
        sale: {
          saleDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          ...(req.user?.role === 'STAFF' ? {
            staff: {
              some: { staffId: req.user.id }
            }
          } : {})
        }
      },
      select: {
        paymentMethod: true,
        amount: true,
        saleId: true,
        createdAt: true,
        sale: {
          select: {
            saleDate: true,
            id: true,
            paymentMethod: true, // Legacy payment method for fallback
            finalAmount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get all sales for the date to handle legacy sales (sales without payment entries)
    const allSalesForDate = await prisma.sale.findMany({
      where: whereClause,
      select: {
        id: true,
        paymentMethod: true,
        finalAmount: true,
        saleDate: true
      }
    });
    
    // Get sale IDs that have payments
    const salesWithPayments = new Set(allDirectPayments.map(p => p.saleId));
    
    console.log('📊 Direct payments query found:', allDirectPayments.length, 'payments');

    if (allDirectPayments.length > 0) {
      // Group by payment method for logging
      const paymentBreakdown: Record<string, { count: number; total: number }> = {};
      allDirectPayments.forEach(p => {
        const method = p.paymentMethod;
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { count: 0, total: 0 };
        }
        paymentBreakdown[method].count++;
        paymentBreakdown[method].total += Number(p.amount);
      });
      
      console.log('📊 Payment breakdown by method:', Object.entries(paymentBreakdown).map(([method, data]) => ({
        method,
        count: data.count,
        total: data.total
      })));
      
      console.log('📊 All payments details:', allDirectPayments.map(p => ({
        method: p.paymentMethod,
        amount: Number(p.amount),
        saleId: p.saleId,
        saleDate: p.sale.saleDate?.toISOString()
      })));
    } else {
      console.log('⚠️ No payments found in SalePayment table for this date');
    }
    
    console.log('📊 Total sales for date:', allSalesForDate.length);
    if (allSalesForDate.length > 0) {
      console.log('📊 Sales details:', allSalesForDate.map(s => ({
        id: s.id,
        saleDate: s.saleDate?.toISOString(),
        paymentMethod: s.paymentMethod,
        finalAmount: Number(s.finalAmount),
        hasPaymentsInTable: salesWithPayments.has(s.id)
      })));
    }

    // Extract all payments from the direct query
    const payments: any[] = [];
    
    // Process all payments from SalePayment table
    allDirectPayments.forEach(payment => {
      const method = payment.paymentMethod;
      // Normalize payment method to ensure consistency
      const normalizedMethod = method ? method.toUpperCase().trim() : 'CASH';
      payments.push({
        paymentMethod: normalizedMethod,
        amount: payment.amount,
        sale: {
          id: payment.saleId,
          saleDate: payment.sale.saleDate
        }
      });
    });
    
    // Handle legacy sales (sales without payment entries in SalePayment table)
    // These sales only have the paymentMethod field on the Sale table
    allSalesForDate.forEach(sale => {
      // Only process sales that don't have entries in SalePayment table
      if (!salesWithPayments.has(sale.id)) {
        // This is a legacy sale - use Sale.paymentMethod
        const method = sale.paymentMethod?.toUpperCase().trim();
        if (method) {
          payments.push({
            paymentMethod: method,
            amount: sale.finalAmount,
            sale: {
              id: sale.id,
              saleDate: sale.saleDate
            }
          });
        }
      }
    });

    console.log('📊 Payments found:', payments.length);
    if (payments.length > 0) {
      console.log('📊 Payment details:', payments.map(p => ({
        method: p.paymentMethod,
        amount: Number(p.amount),
        saleId: p.sale.id,
        saleDate: p.sale.saleDate?.toISOString()
      })));
    } else {
      // Debug: Check if there are any sales for this date
      const salesCount = await prisma.sale.count({ where: whereClause });
      console.log('📊 Sales count for date range:', salesCount);
      
      // Also check all recent payments to see what payment methods exist
      const recentPayments = await prisma.salePayment.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          paymentMethod: true,
          amount: true,
          sale: {
            select: {
              saleDate: true
            }
          }
        }
      });
      console.log('📊 Recent payments (last 50, all dates):', recentPayments.map(p => ({
        method: p.paymentMethod,
        amount: Number(p.amount),
        saleDate: p.sale.saleDate?.toISOString()
      })));
    }

    // Group payments by method and calculate totals from salePayment table
    const paymentSummary: Record<string, { method: string; total: number; count: number }> = {};
    const validMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
    
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      // Ensure method is uppercase and valid
      let normalizedMethod = method?.toUpperCase().trim();
      
      if (!normalizedMethod) {
        console.warn('⚠️ Payment with invalid method:', payment);
        return;
      }
      
      // Validate and normalize the method
      if (!validMethods.includes(normalizedMethod)) {
        console.warn(`⚠️ Invalid payment method "${normalizedMethod}" found, defaulting to CASH`);
        normalizedMethod = 'CASH';
      }
      
      if (!paymentSummary[normalizedMethod]) {
        paymentSummary[normalizedMethod] = {
          method: normalizedMethod,
          total: 0,
          count: 0
        };
      }
      paymentSummary[normalizedMethod].total += Number(payment.amount);
      paymentSummary[normalizedMethod].count += 1;
    });

    console.log('📊 Payment summary after salePayment:', Object.keys(paymentSummary).map(k => ({
      method: k,
      total: paymentSummary[k].total,
      count: paymentSummary[k].count
    })));

    // Process legacy sales (sales without payment entries in SalePayment table)
    console.log('📊 Processing legacy sales (sales without payment entries):');
    
    // Process all sales - if they have payments in salePayment, those are already counted above
    // If they don't have payments, use the paymentMethod from Sale table
    allSalesForDate.forEach(sale => {
      // Skip sales that already have payments in SalePayment table (already counted above)
      if (salesWithPayments.has(sale.id)) {
        return;
      }
      
      // This is a legacy sale or sale without payment entries - use Sale.paymentMethod
      const method = sale.paymentMethod?.toUpperCase().trim();
      if (!method) {
        console.warn('⚠️ Sale with invalid paymentMethod:', sale.id, sale.paymentMethod);
        return;
      }
      
      // Normalize the method to ensure it matches our enum values
      const validMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
      const normalizedMethod = validMethods.includes(method) ? method : 'CASH';
      
      if (method !== normalizedMethod) {
        console.warn(`⚠️ Legacy sale ${sale.id} has paymentMethod "${method}" normalized to "${normalizedMethod}"`);
      }
      
      if (!paymentSummary[normalizedMethod]) {
        paymentSummary[normalizedMethod] = {
          method: normalizedMethod,
          total: 0,
          count: 0
        };
      }
      paymentSummary[normalizedMethod].total += Number(sale.finalAmount);
      paymentSummary[normalizedMethod].count += 1;
    });

    console.log('📊 Final payment summary:', Object.keys(paymentSummary).map(k => ({
      method: k,
      total: paymentSummary[k].total,
      count: paymentSummary[k].count
    })));

    // Convert to array and ensure all payment methods are represented
    const allMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
    const summary = allMethods.map(method => ({
      method,
      total: paymentSummary[method]?.total || 0,
      count: paymentSummary[method]?.count || 0
    }));

    console.log('📊 Summary array before sending:', summary.map(s => ({
      method: s.method,
      total: s.total,
      count: s.count
    })));
    console.log('📊 Summary array length:', summary.length, '(should be 5)');

    // Calculate grand total
    const grandTotal = summary.reduce((sum, item) => sum + item.total, 0);

    const responseData = {
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        summary,
        grandTotal
      }
    };

    console.log('📊 Final response data:', JSON.stringify(responseData, null, 2));

    res.json(responseData);
  } catch (error) {
    console.error('Get daily payment summary error:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};