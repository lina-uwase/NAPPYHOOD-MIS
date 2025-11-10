"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerStats = exports.getTopCustomers = exports.toggleCustomerActive = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const database_1 = require("../utils/database");
const getAllCustomers = async (req, res) => {
    try {
        const { page = '1', limit = '10', search, isActive, gender, province, district } = req.query;
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
        console.log('📝 Customer creation request received:', {
            body: req.body,
            user: req.user?.id,
            headers: {
                'content-type': req.headers['content-type'],
                authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'None'
            }
        });
        let { fullName, gender, location, district, province, birthDay, birthMonth, birthYear, isDependent, parentId, saleCount } = req.body;
        let phone = req.body.phone;
        let email = req.body.email;
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
        // For dependent customers, inherit parent's phone and email if not provided
        if (isDependent && parentId) {
            const parentCustomer = await database_1.prisma.customer.findUnique({
                where: { id: parentId },
                select: { phone: true, email: true }
            });
            if (!parentCustomer) {
                res.status(400).json({ error: 'Parent customer not found' });
                return;
            }
            // If dependent doesn't have phone/email, inherit from parent
            if (!phone)
                phone = parentCustomer.phone;
            if (!email)
                email = parentCustomer.email;
        }
        // Check phone uniqueness only for non-dependent customers with phone
        if (phone && !isDependent) {
            const existingCustomer = await database_1.prisma.customer.findFirst({
                where: {
                    phone: phone,
                    isDependent: false
                }
            });
            if (existingCustomer) {
                res.status(400).json({ error: 'Customer with this phone number already exists' });
                return;
            }
        }
        // Check if customer with email already exists (only for non-dependent customers or dependent customers with custom email)
        if (email && !isDependent) {
            const existingCustomer = await database_1.prisma.customer.findFirst({
                where: { email }
            });
            if (existingCustomer) {
                res.status(400).json({ error: 'Customer with this email already exists' });
                return;
            }
        }
        // For dependent customers with custom email (not inherited), check uniqueness
        if (email && isDependent && req.body.email) {
            const existingCustomer = await database_1.prisma.customer.findFirst({
                where: { email }
            });
            if (existingCustomer) {
                res.status(400).json({ error: 'Customer with this email already exists' });
                return;
            }
        }
        // Parent existence already verified above if isDependent
        const customer = await database_1.prisma.customer.create({
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
                parentId: isDependent ? parentId : null,
                saleCount: saleCount ? parseInt(saleCount) : 0
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
        let { fullName, gender, location, district, province, phone, email, birthDay, birthMonth, birthYear, isDependent, parentId } = req.body;
        const existingCustomer = await database_1.prisma.customer.findUnique({
            where: { id }
        });
        if (!existingCustomer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        // Check phone uniqueness only for non-dependent customers
        if (phone && phone !== existingCustomer.phone && !existingCustomer.isDependent) {
            const phoneExists = await database_1.prisma.customer.findFirst({
                where: {
                    phone: phone,
                    isDependent: false,
                    id: { not: id } // Exclude current customer
                }
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
        if (isDependent !== undefined)
            updateData.isDependent = isDependent;
        if (parentId !== undefined)
            updateData.parentId = isDependent ? parentId : null;
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