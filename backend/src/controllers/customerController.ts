import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, isActive, gender, province, district } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (isActive !== undefined) {
      whereClause.isActive = String(isActive) === 'true';
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (gender && gender !== 'ALL') {
      whereClause.gender = gender;
    }

    if (province) {
      whereClause.province = province;
    }

    if (district) {
      whereClause.district = district;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          sales: {
            select: {
              id: true,
              saleDate: true,
              finalAmount: true
            },
            orderBy: { saleDate: 'desc' },
            take: 3
          }
        }
      }),
      prisma.customer.count({ where: whereClause })
    ]);

    // Transform customers to include calculated fields expected by frontend
    const transformedCustomers = customers.map(customer => ({
      ...customer,
      totalSales: customer.saleCount,
      totalSpent: Number(customer.totalSpent),
      // Convert decimal to number and format dates properly
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      lastSale: customer.lastSale?.toISOString(),
    }));

    res.json({
      success: true,
      data: {
        customers: transformedCustomers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
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
          },
          orderBy: { saleDate: 'desc' }
        },
        discounts: {
          include: {
            discountRule: true
          },
          orderBy: { usedAt: 'desc' }
        }
      }
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('📝 Customer creation request received:', {
      body: req.body,
      user: req.user?.id,
      headers: {
        'content-type': req.headers['content-type'],
        authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'None'
      }
    });

    const {
      fullName,
      gender,
      location,
      district,
      province,
      phone,
      email,
      birthDay,
      birthMonth,
      birthYear,
      isDependent,
      parentId
    } = req.body;

    if (!fullName || !gender) {
      console.log('❌ Validation failed: Missing required fields', { fullName, gender });
      res.status(400).json({ error: 'Required fields: fullName, gender' });
      return;
    }

    // Phone is required for non-dependent customers
    if (!isDependent && !phone) {
      res.status(400).json({ error: 'Phone number is required for non-dependent customers' });
      return;
    }

    // Parent is required for dependent customers
    if (isDependent && !parentId) {
      res.status(400).json({ error: 'Parent customer is required for dependent customers' });
      return;
    }

    // Check if customer with phone already exists (only if phone provided)
    if (phone) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone }
      });

      if (existingCustomer) {
        res.status(400).json({ error: 'Customer with this phone number already exists' });
        return;
      }
    }

    // Verify parent exists for dependent customers
    if (isDependent) {
      const parentCustomer = await prisma.customer.findUnique({
        where: { id: parentId }
      });

      if (!parentCustomer) {
        res.status(400).json({ error: 'Parent customer not found' });
        return;
      }
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        gender,
        location,
        district,
        province,
        phone: phone || null,
        email: email || null,
        birthDay: parseInt(birthDay),
        birthMonth: parseInt(birthMonth),
        birthYear: birthYear ? parseInt(birthYear) : null,
        isDependent: isDependent || false,
        parentId: isDependent ? parentId : null
      }
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer registered successfully'
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      fullName,
      gender,
      location,
      district,
      province,
      phone,
      email,
      birthDay,
      birthMonth,
      birthYear,
      isDependent,
      parentId
    } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Check if phone is being changed and if new phone already exists
    if (phone && phone !== existingCustomer.phone) {
      const phoneExists = await prisma.customer.findUnique({
        where: { phone }
      });
      if (phoneExists) {
        res.status(400).json({ error: 'Customer with this phone number already exists' });
        return;
      }
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (gender !== undefined) updateData.gender = gender;
    if (location !== undefined) updateData.location = location;
    if (district !== undefined) updateData.district = district;
    if (province !== undefined) updateData.province = province;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email || null;
    if (birthDay !== undefined) updateData.birthDay = parseInt(birthDay);
    if (birthMonth !== undefined) updateData.birthMonth = parseInt(birthMonth);
    if (birthYear !== undefined) updateData.birthYear = birthYear ? parseInt(birthYear) : null;
    if (isDependent !== undefined) updateData.isDependent = isDependent;
    if (parentId !== undefined) updateData.parentId = isDependent ? parentId : null;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    await prisma.customer.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Customer deactivated successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleCustomerActive = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.customer.findUnique({ where: { id }, select: { isActive: true } });
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    const updated = await prisma.customer.update({ where: { id }, data: { isActive: !existing.isActive } });
    res.json({ success: true, data: updated, message: 'Customer status updated' });
  } catch (error) {
    console.error('Toggle customer active error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTopCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '5' } = req.query;
    const limitNum = parseInt(limit as string);

    const topCustomers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { saleCount: 'desc' },
      take: limitNum,
      select: {
        id: true,
        fullName: true,
        phone: true,
        saleCount: true,
        totalSpent: true,
        lastSale: true,
        birthDay: true,
        birthMonth: true
      }
    });

    res.json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCustomerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          select: {
            finalAmount: true,
            saleDate: true,
            loyaltyPointsEarned: true
          }
        }
      }
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const currentMonth = new Date().getMonth() + 1;
    const isBirthdayMonth = customer.birthMonth === currentMonth;
    const isEligibleForSixthSaleDiscount = (customer.saleCount + 1) % 6 === 0;

    const stats = {
      totalSales: customer.saleCount,
      totalSpent: customer.totalSpent,
      loyaltyPoints: customer.loyaltyPoints,
      lastSale: customer.lastSale,
      averageSpending: customer.saleCount > 0 ? Number(customer.totalSpent) / customer.saleCount : 0,
      isBirthdayMonth,
      isEligibleForSixthSaleDiscount,
      monthlySales: customer.sales.reduce((acc: any, sale) => {
        const month = new Date(sale.saleDate).getMonth();
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        customer,
        stats
      }
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};