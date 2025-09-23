"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerStats = exports.toggleCustomerActive = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
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
            database_1.prisma.customer.count({ where: whereClause })
        ]);
        res.json({
            success: true,
            data: {
                customers,
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
        if (!fullName || !gender || !location || !district || !province || !phone || !birthDay || !birthMonth) {
            res.status(400).json({ error: 'All required fields must be provided' });
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
const getCustomerStats = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await database_1.prisma.customer.findUnique({
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
            monthlyVisits: customer.visits.reduce((acc, visit) => {
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
    }
    catch (error) {
        console.error('Get customer stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCustomerStats = getCustomerStats;
//# sourceMappingURL=customerController.js.map