"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStaff = exports.getAllStaffPerformance = exports.getStaffPerformance = exports.getStaffById = exports.getAllStaff = void 0;
const database_1 = require("../utils/database");
const getAllStaff = async (req, res) => {
    try {
        const { isActive, role, search } = req.query;
        const whereClause = {};
        // Only filter by isActive if explicitly provided
        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }
        if (role) {
            whereClause.role = role;
        }
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }
        const staff = await database_1.prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                isActive: true,
                createdAt: true
            },
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            data: staff
        });
    }
    catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllStaff = getAllStaff;
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                isActive: true,
                createdAt: true
            }
        });
        if (!staff) {
            res.status(404).json({ error: 'Staff member not found' });
            return;
        }
        res.json({
            success: true,
            data: staff
        });
    }
    catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStaffById = getStaffById;
const getStaffPerformance = async (req, res) => {
    try {
        const { id } = req.params;
        const { period = 'month', startDate, endDate } = req.query;
        const staff = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        if (!staff) {
            res.status(404).json({ error: 'Staff member not found' });
            return;
        }
        let dateFilter = {};
        const now = new Date();
        if (startDate && endDate) {
            dateFilter = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        else {
            switch (period) {
                case 'today':
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    dateFilter = { gte: today, lt: tomorrow };
                    break;
                case 'week':
                    const weekStart = new Date();
                    weekStart.setDate(now.getDate() - 7);
                    dateFilter = { gte: weekStart };
                    break;
                case 'month':
                    const monthStart = new Date();
                    monthStart.setMonth(now.getMonth() - 1);
                    dateFilter = { gte: monthStart };
                    break;
                default:
                    const defaultStart = new Date();
                    defaultStart.setMonth(now.getMonth() - 1);
                    dateFilter = { gte: defaultStart };
            }
        }
        // Get staff sales and performance data
        const sales = await database_1.prisma.sale.findMany({
            where: {
                staff: {
                    some: { staffId: id }
                },
                saleDate: dateFilter
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                services: {
                    include: {
                        service: {
                            select: {
                                name: true,
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: { saleDate: 'desc' }
        });
        // Calculate performance metrics
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.finalAmount), 0);
        const averageRevenuePerSale = totalSales > 0 ? totalRevenue / totalSales : 0;
        const uniqueCustomers = new Set(sales.map((v) => v.customerId)).size;
        // Service categories served
        const serviceCategories = new Map();
        sales.forEach((sale) => {
            sale.services.forEach((vs) => {
                const category = vs.service.category;
                serviceCategories.set(category, (serviceCategories.get(category) || 0) + 1);
            });
        });
        // Daily performance (for charts)
        const dailyPerformance = sales.reduce((acc, sale) => {
            const date = sale.saleDate.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { sales: 0, revenue: 0 };
            }
            acc[date].sales += 1;
            acc[date].revenue += Number(sale.finalAmount);
            return acc;
        }, {});
        const performanceData = Object.entries(dailyPerformance).map(([date, data]) => ({
            date,
            sales: data.sales,
            revenue: data.revenue
        })).sort((a, b) => a.date.localeCompare(b.date));
        res.json({
            success: true,
            data: {
                staff,
                period,
                metrics: {
                    totalSales,
                    totalRevenue,
                    averageRevenuePerSale,
                    uniqueCustomers,
                    serviceCategories: Array.from(serviceCategories.entries()).map(([category, count]) => ({
                        category,
                        count
                    }))
                },
                sales,
                performanceChart: performanceData
            }
        });
    }
    catch (error) {
        console.error('Get staff performance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStaffPerformance = getStaffPerformance;
const getAllStaffPerformance = async (req, res) => {
    try {
        const { period = 'month', startDate, endDate } = req.query;
        let dateFilter = {};
        const now = new Date();
        if (startDate && endDate) {
            dateFilter = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        else {
            switch (period) {
                case 'today':
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    dateFilter = { gte: today, lt: tomorrow };
                    break;
                case 'week':
                    const weekStart = new Date();
                    weekStart.setDate(now.getDate() - 7);
                    dateFilter = { gte: weekStart };
                    break;
                case 'month':
                    const monthStart = new Date();
                    monthStart.setMonth(now.getMonth() - 1);
                    dateFilter = { gte: monthStart };
                    break;
                default:
                    const defaultStart = new Date();
                    defaultStart.setMonth(now.getMonth() - 1);
                    dateFilter = { gte: defaultStart };
            }
        }
        // Get all active staff
        const allStaff = await database_1.prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                role: true
            }
        });
        // Get performance data for each staff member
        const staffPerformance = await Promise.all(allStaff.map(async (staff) => {
            const sales = await database_1.prisma.sale.findMany({
                where: {
                    staff: {
                        some: { staffId: staff.id }
                    },
                    saleDate: dateFilter
                }
            });
            const totalSales = sales.length;
            const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.finalAmount), 0);
            const uniqueCustomers = new Set(sales.map((v) => v.customerId)).size;
            return {
                staff,
                metrics: {
                    totalSales,
                    totalRevenue,
                    averageRevenuePerSale: totalSales > 0 ? totalRevenue / totalSales : 0,
                    uniqueCustomers
                }
            };
        }));
        // Sort by total revenue descending
        staffPerformance.sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue);
        res.json({
            success: true,
            data: {
                period,
                staffPerformance
            }
        });
    }
    catch (error) {
        console.error('Get all staff performance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllStaffPerformance = getAllStaffPerformance;
const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, isActive } = req.body;
        const existingStaff = await database_1.prisma.user.findUnique({
            where: { id }
        });
        if (!existingStaff) {
            res.status(404).json({ error: 'Staff member not found' });
            return;
        }
        // Check if phone is being changed and if new phone already exists (only among active users)
        if (phone && phone !== existingStaff.phone) {
            const phoneExists = await database_1.prisma.user.findFirst({
                where: {
                    phone,
                    isActive: true,
                    id: { not: id } // Exclude current user
                }
            });
            if (phoneExists) {
                res.status(400).json({ error: 'User with this phone number already exists' });
                return;
            }
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (phone !== undefined)
            updateData.phone = phone;
        if (role !== undefined)
            updateData.role = role;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const staff = await database_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                isActive: true,
                updatedAt: true
            }
        });
        res.json({
            success: true,
            data: staff,
            message: 'Staff member updated successfully'
        });
    }
    catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateStaff = updateStaff;
//# sourceMappingURL=staffController.js.map