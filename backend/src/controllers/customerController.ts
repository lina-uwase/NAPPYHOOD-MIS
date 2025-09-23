import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, isActive } = req.query;
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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          visits: {
            select: {
              id: true,
              visitDate: true,
              finalAmount: true
            },
            orderBy: { visitDate: 'desc' },
            take: 3
          }
        }
      }),
      prisma.customer.count({ where: whereClause })
    ]);

    // Transform customers to include calculated fields expected by frontend
    const transformedCustomers = customers.map(customer => ({
      ...customer,
      totalVisits: customer.visitCount,
      totalSpent: Number(customer.totalSpent),
      // Convert decimal to number and format dates properly
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      lastVisit: customer.lastVisit?.toISOString(),
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
        visits: {
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
          orderBy: { visitDate: 'desc' }
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
      birthYear
    } = req.body;

    if (!fullName || !gender || !location || !district || !province || !phone || !birthDay || !birthMonth) {
      res.status(400).json({ error: 'All required fields must be provided' });
      return;
    }

    // Check if customer with phone already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone }
    });

    if (existingCustomer) {
      res.status(400).json({ error: 'Customer with this phone number already exists' });
      return;
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        gender,
        location,
        district,
        province,
        phone,
        email: email || null,
        birthDay: parseInt(birthDay),
        birthMonth: parseInt(birthMonth),
        birthYear: birthYear ? parseInt(birthYear) : null
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
      birthYear
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

export const getCustomerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        visits: {
          select: {
            finalAmount: true,
            visitDate: true,
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
    const isEligibleForSixthVisitDiscount = (customer.visitCount + 1) % 6 === 0;

    const stats = {
      totalVisits: customer.visitCount,
      totalSpent: customer.totalSpent,
      loyaltyPoints: customer.loyaltyPoints,
      lastVisit: customer.lastVisit,
      averageSpending: customer.visitCount > 0 ? Number(customer.totalSpent) / customer.visitCount : 0,
      isBirthdayMonth,
      isEligibleForSixthVisitDiscount,
      monthlyVisits: customer.visits.reduce((acc: any, visit) => {
        const month = new Date(visit.visitDate).getMonth();
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