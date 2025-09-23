"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueAnalytics = exports.getDashboardStats = void 0;
const database_1 = require("../utils/database");
const getDashboardStats = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const now = new Date();
        let dateFilter = {};
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
        // Get basic counts
        const [totalCustomers, totalServices, activeStaff, periodVisits, allTimeVisits, totalRevenue, averageVisitValue] = await Promise.all([
            database_1.prisma.customer.count(),
            database_1.prisma.service.count({ where: { isActive: true } }),
            database_1.prisma.user.count({ where: { isActive: true } }),
            database_1.prisma.visit.count({ where: { visitDate: dateFilter } }),
            database_1.prisma.visit.count(),
            database_1.prisma.visit.aggregate({
                where: { visitDate: dateFilter },
                _sum: { finalAmount: true }
            }),
            database_1.prisma.visit.aggregate({
                where: { visitDate: dateFilter },
                _avg: { finalAmount: true }
            })
        ]);
        // Get customer retention metrics
        const returningCustomers = await database_1.prisma.customer.count({
            where: {
                visitCount: { gt: 1 }
            }
        });
        const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
        // Get top services
        const topServices = await database_1.prisma.visitService.groupBy({
            by: ['serviceId'],
            where: {
                visit: {
                    visitDate: dateFilter
                }
            },
            _sum: {
                quantity: true,
                totalPrice: true
            },
            orderBy: {
                _sum: {
                    totalPrice: 'desc'
                }
            },
            take: 5
        });
        const topServicesWithDetails = await Promise.all(topServices.map(async (service) => {
            const serviceDetail = await database_1.prisma.service.findUnique({
                where: { id: service.serviceId },
                select: { name: true, category: true }
            });
            return {
                service: serviceDetail,
                quantity: service._sum.quantity || 0,
                revenue: Number(service._sum.totalPrice || 0)
            };
        }));
        // Get revenue trends (last 30 days)
        const revenueTrend = await database_1.prisma.visit.groupBy({
            by: ['visitDate'],
            where: {
                visitDate: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            },
            _sum: {
                finalAmount: true
            },
            orderBy: {
                visitDate: 'asc'
            }
        });
        const dailyRevenue = revenueTrend.map(day => ({
            date: day.visitDate.toISOString().split('T')[0],
            revenue: Number(day._sum.finalAmount || 0)
        }));
        // Get staff performance summary
        const staffPerformance = await database_1.prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                role: true,
                staffVisits: {
                    where: {
                        visit: {
                            visitDate: dateFilter
                        }
                    },
                    include: {
                        visit: {
                            select: {
                                finalAmount: true
                            }
                        }
                    }
                }
            }
        });
        const staffStats = staffPerformance.map(staff => ({
            id: staff.id,
            name: staff.name,
            role: staff.role,
            visitsCount: staff.staffVisits.length,
            totalRevenue: staff.staffVisits.reduce((sum, sv) => sum + Number(sv.visit.finalAmount), 0)
        })).sort((a, b) => b.totalRevenue - a.totalRevenue);
        // Get upcoming birthdays (next 30 days)
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const upcomingBirthdays = await database_1.prisma.customer.findMany({
            where: {
                OR: [
                    {
                        birthMonth: currentMonth,
                        birthDay: { gte: currentDay }
                    },
                    {
                        birthMonth: nextMonth,
                        birthDay: { lte: currentDay }
                    }
                ]
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                birthDay: true,
                birthMonth: true,
                visitCount: true
            },
            orderBy: [
                { birthMonth: 'asc' },
                { birthDay: 'asc' }
            ],
            take: 10
        });
        // Get customers eligible for 6th visit discount
        const sixthVisitEligible = await database_1.prisma.customer.findMany({
            where: {
                visitCount: {
                    in: [5, 11, 17, 23, 29, 35] // Next visit will be 6th, 12th, 18th, etc.
                }
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                visitCount: true,
                lastVisit: true
            },
            orderBy: { lastVisit: 'desc' },
            take: 10
        });
        res.json({
            success: true,
            data: {
                overview: {
                    totalCustomers,
                    totalServices,
                    activeStaff,
                    periodVisits,
                    allTimeVisits,
                    totalRevenue: Number(totalRevenue._sum.finalAmount || 0),
                    averageVisitValue: Number(averageVisitValue._avg.finalAmount || 0),
                    customerRetentionRate: Math.round(customerRetentionRate * 100) / 100
                },
                topServices: topServicesWithDetails,
                revenueTrend: dailyRevenue,
                staffPerformance: staffStats,
                upcomingBirthdays,
                sixthVisitEligible,
                period
            }
        });
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
        const categoryRevenue = await database_1.prisma.visitService.groupBy({
            by: ['serviceId'],
            where: {
                visit: {
                    visitDate: dateFilter
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
        const hourlyVisits = await database_1.prisma.visit.findMany({
            where: { visitDate: dateFilter },
            select: { visitDate: true, finalAmount: true }
        });
        const hourlyStats = hourlyVisits.reduce((acc, visit) => {
            const hour = visit.visitDate.getHours();
            if (!acc[hour]) {
                acc[hour] = { visits: 0, revenue: 0 };
            }
            acc[hour].visits += 1;
            acc[hour].revenue += Number(visit.finalAmount);
            return acc;
        }, {});
        const peakHours = Object.entries(hourlyStats).map(([hour, stats]) => ({
            hour: parseInt(hour),
            visits: stats.visits,
            revenue: stats.revenue
        })).sort((a, b) => b.visits - a.visits);
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