"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerStats = exports.getTopCustomers = exports.toggleCustomerActive = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const database_1 = require("../utils/database");
const getAllCustomers = async (req, res) => {
    try {
        const { page = '1', limit = '10', search, isActive } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = {};
        if (isActive !== undefined) {
            whereClause.isActive = String(isActive) === 'true';
        }
        if (search) {
            whereClause.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [customers, total] = await Promise.all([
            database_1.prisma.customer.findMany({
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
            database_1.prisma.customer.count({ where: whereClause })
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
    }
    catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllCustomers = getAllCustomers;
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await database_1.prisma.customer.findUnique({
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
    }
    catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCustomerById = getCustomerById;
const createCustomer = async (req, res) => {
    try {
        const { fullName, gender, location, district, province, phone, email, birthDay, birthMonth, birthYear } = req.body;
        if (!fullName || !gender || !phone) {
            res.status(400).json({ error: 'Required fields: fullName, gender, phone' });
            return;
        }
        // Check if customer with phone already exists
        const existingCustomer = await database_1.prisma.customer.findUnique({
            where: { phone }
        });
        if (existingCustomer) {
            res.status(400).json({ error: 'Customer with this phone number already exists' });
            return;
        }
        const customer = await database_1.prisma.customer.create({
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
    }
    catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, gender, location, district, province, phone, email, birthDay, birthMonth, birthYear } = req.body;
        const existingCustomer = await database_1.prisma.customer.findUnique({
            where: { id }
        });
        if (!existingCustomer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        // Check if phone is being changed and if new phone already exists
        if (phone && phone !== existingCustomer.phone) {
            const phoneExists = await database_1.prisma.customer.findUnique({
                where: { phone }
            });
            if (phoneExists) {
                res.status(400).json({ error: 'Customer with this phone number already exists' });
                return;
            }
        }
        const updateData = {};
        if (fullName !== undefined)
            updateData.fullName = fullName;
        if (gender !== undefined)
            updateData.gender = gender;
        if (location !== undefined)
            updateData.location = location;
        if (district !== undefined)
            updateData.district = district;
        if (province !== undefined)
            updateData.province = province;
        if (phone !== undefined)
            updateData.phone = phone;
        if (email !== undefined)
            updateData.email = email || null;
        if (birthDay !== undefined)
            updateData.birthDay = parseInt(birthDay);
        if (birthMonth !== undefined)
            updateData.birthMonth = parseInt(birthMonth);
        if (birthYear !== undefined)
            updateData.birthYear = birthYear ? parseInt(birthYear) : null;
        const customer = await database_1.prisma.customer.update({
            where: { id },
            data: updateData
        });
        res.json({
            success: true,
            data: customer,
            message: 'Customer updated successfully'
        });
    }
    catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const existingCustomer = await database_1.prisma.customer.findUnique({ where: { id } });
        if (!existingCustomer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        await database_1.prisma.customer.update({ where: { id }, data: { isActive: false } });
        res.json({ success: true, message: 'Customer deactivated successfully' });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteCustomer = deleteCustomer;
const toggleCustomerActive = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await database_1.prisma.customer.findUnique({ where: { id }, select: { isActive: true } });
        if (!existing) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        const updated = await database_1.prisma.customer.update({ where: { id }, data: { isActive: !existing.isActive } });
        res.json({ success: true, data: updated, message: 'Customer status updated' });
    }
    catch (error) {
        console.error('Toggle customer active error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.toggleCustomerActive = toggleCustomerActive;
const getTopCustomers = async (req, res) => {
    try {
        const { limit = '5' } = req.query;
        const limitNum = parseInt(limit);
        const topCustomers = await database_1.prisma.customer.findMany({
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
    }
    catch (error) {
        console.error('Get top customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTopCustomers = getTopCustomers;
const getCustomerStats = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await database_1.prisma.customer.findUnique({
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
            monthlySales: customer.sales.reduce((acc, sale) => {
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
    }
    catch (error) {
        console.error('Get customer stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCustomerStats = getCustomerStats;
//# sourceMappingURL=customerController.js.map