"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueAnalytics = exports.getDashboardStats = void 0;
const database_1 = require("../utils/database");
const getDashboardStats = async (req, res) => {
    try {
        console.log('🔍 Starting dashboard stats query v3...');
        const { period = 'month' } = req.query;
        // Calculate date range based on period
        const now = new Date();
        let periodStart = new Date();
        switch (period) {
            case 'week':
                periodStart.setDate(now.getDate() - 7);
                break;
            case 'month':
                periodStart.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                periodStart.setFullYear(now.getFullYear() - 1);
                break;
            default:
                periodStart.setMonth(now.getMonth() - 1);
        }
        // Get basic counts
        const totalCustomers = await database_1.prisma.customer.count();
        // Get new customers who came today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const newCustomers = await database_1.prisma.customer.count({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });
        const totalServices = await database_1.prisma.service.count({ where: { isActive: true } });
        const activeStaff = await database_1.prisma.user.count({ where: { isActive: true } });
        const allTimeSales = await database_1.prisma.sale.count();
        // Get revenue data
        const totalRevenueResult = await database_1.prisma.sale.aggregate({
            _sum: { finalAmount: true }
        });
        const averageSaleResult = await database_1.prisma.sale.aggregate({
            _avg: { finalAmount: true }
        });
        // Get period-specific data
        const periodSales = await database_1.prisma.sale.count({
            where: { saleDate: { gte: periodStart } }
        });
        const periodRevenueResult = await database_1.prisma.sale.aggregate({
            where: { saleDate: { gte: periodStart } },
            _sum: { finalAmount: true }
        });
        // Customer retention
        const returningCustomers = await database_1.prisma.customer.count({
            where: { saleCount: { gt: 1 } }
        });
        const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
        // Get top services data
        const topServicesData = await database_1.prisma.saleService.groupBy({
            by: ['serviceId'],
            where: {
                sale: { saleDate: { gte: periodStart } }
            },
            _sum: {
                quantity: true,
                totalPrice: true
            },
            _count: { serviceId: true },
            orderBy: { _sum: { totalPrice: 'desc' } },
            take: 5
        });
        // Get service details for top services
        const topServices = await Promise.all(topServicesData.map(async (item) => {
            const service = await database_1.prisma.service.findUnique({
                where: { id: item.serviceId },
                select: { name: true, category: true }
            });
            return {
                name: service?.name || 'Unknown Service',
                category: service?.category || 'Unknown',
                count: Number(item._sum.quantity || 0),
                revenue: Number(item._sum.totalPrice || 0)
            };
        }));
        // Get revenue trend for last 7 days
        const revenueTrendData = await database_1.prisma.sale.findMany({
            where: { saleDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            select: { saleDate: true, finalAmount: true }
        });
        // Group by day
        const revenueTrend = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dayStr = date.toISOString().split('T')[0];
            const dayRevenue = revenueTrendData
                .filter(sale => sale.saleDate.toISOString().split('T')[0] === dayStr)
                .reduce((sum, sale) => sum + Number(sale.finalAmount), 0);
            return {
                date: dayStr,
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dayRevenue
            };
        });
        // Get most recent customers (by last sale date, then by creation date)
        const topCustomers = await database_1.prisma.customer.findMany({
            orderBy: [
                { lastSale: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 5,
            select: {
                id: true,
                fullName: true,
                phone: true,
                saleCount: true,
                totalSpent: true,
                lastSale: true,
                createdAt: true
            }
        });
        // Skip upcoming birthdays for now to avoid null check issues
        const upcomingBirthdaysFiltered = [];
        // Get customers eligible for 6th sale discount
        const sixthSaleEligible = await database_1.prisma.customer.findMany({
            where: {
                saleCount: { in: [5, 11, 17, 23, 29] }, // Every 6th sale
                isActive: true
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                saleCount: true,
                lastSale: true
            },
            take: 5,
            orderBy: { lastSale: 'desc' }
        });
        console.log('🔍 All queries completed, sending response...');
        res.json({
            success: true,
            data: {
                overview: {
                    newCustomers, // Changed from totalCustomers to newCustomers for the selected period
                    totalCustomers, // Keep total customers for reference if needed
                    totalServices,
                    activeStaff,
                    periodSales,
                    allTimeSales,
                    totalRevenue: Number(totalRevenueResult._sum.finalAmount || 0),
                    averageSaleValue: Number(averageSaleResult._avg.finalAmount || 0),
                    customerRetentionRate: Math.round(customerRetentionRate * 100) / 100
                },
                topServices,
                revenueTrend,
                topCustomers,
                upcomingBirthdays: upcomingBirthdaysFiltered,
                sixthSaleEligible,
                period: period
            }
        });
        console.log('🔍 Dashboard stats completed successfully');
    }
    catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getRevenueAnalytics = async (req, res) => {
    try {
        const { period = 'month', groupBy = 'day' } = req.query;
        const now = new Date();
        let dateFilter = {};
        switch (period) {
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
            case 'quarter':
                const quarterStart = new Date();
                quarterStart.setMonth(now.getMonth() - 3);
                dateFilter = { gte: quarterStart };
                break;
            case 'year':
                const yearStart = new Date();
                yearStart.setFullYear(now.getFullYear() - 1);
                dateFilter = { gte: yearStart };
                break;
            default:
                const defaultStart = new Date();
                defaultStart.setMonth(now.getMonth() - 1);
                dateFilter = { gte: defaultStart };
        }
        // Revenue by service category
        const categoryRevenue = await database_1.prisma.saleService.groupBy({
            by: ['serviceId'],
            where: {
                sale: {
                    saleDate: dateFilter
                }
            },
            _sum: {
                totalPrice: true,
                quantity: true
            }
        });
        const categoryStats = new Map();
        for (const item of categoryRevenue) {
            const service = await database_1.prisma.service.findUnique({
                where: { id: item.serviceId },
                select: { category: true, name: true }
            });
            if (service) {
                const existing = categoryStats.get(service.category) || { revenue: 0, services: 0, quantity: 0 };
                existing.revenue += Number(item._sum.totalPrice || 0);
                existing.quantity += Number(item._sum.quantity || 0);
                existing.services += 1;
                categoryStats.set(service.category, existing);
            }
        }
        const categoryData = Array.from(categoryStats.entries()).map(([category, stats]) => ({
            category,
            ...stats
        }));
        // Peak hours analysis
        const hourlySales = await database_1.prisma.sale.findMany({
            where: { saleDate: dateFilter },
            select: { saleDate: true, finalAmount: true }
        });
        const hourlyStats = hourlySales.reduce((acc, sale) => {
            const hour = sale.saleDate.getHours();
            if (!acc[hour]) {
                acc[hour] = { sales: 0, revenue: 0 };
            }
            acc[hour].sales += 1;
            acc[hour].revenue += Number(sale.finalAmount);
            return acc;
        }, {});
        const peakHours = Object.entries(hourlyStats).map(([hour, stats]) => ({
            hour: parseInt(hour),
            sales: stats.sales,
            revenue: stats.revenue
        })).sort((a, b) => b.sales - a.sales);
        res.json({
            success: true,
            data: {
                categoryRevenue: categoryData,
                peakHours,
                period
            }
        });
    }
    catch (error) {
        console.error('Get revenue analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getRevenueAnalytics = getRevenueAnalytics;
//# sourceMappingURL=dashboardController.js.map