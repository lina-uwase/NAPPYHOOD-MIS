"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisitsByCustomer = exports.getVisitsSummary = exports.completeVisit = exports.deleteVisit = exports.updateVisit = exports.getVisitById = exports.getAllVisits = exports.createVisit = void 0;
const database_1 = require("../utils/database");
const createVisit = async (req, res) => {
    try {
        const { customerId, services, // Array of VisitService
        serviceIds, // Optional: Array<string> (frontend simplified payload)
        staffIds, // Array of staff IDs
        notes } = req.body;
        const normalizedServices = Array.isArray(services) && services.length > 0
            ? services
            : Array.isArray(serviceIds) && serviceIds.length > 0
                ? serviceIds.map((sid) => ({ serviceId: sid, quantity: 1, isChild: false, isCombined: false }))
                : [];
        if (!customerId || normalizedServices.length === 0) {
            res.status(400).json({ error: 'Customer ID and services are required' });
            return;
        }
        // Get customer data
        const customer = await database_1.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                visits: {
                    select: { visitDate: true },
                    orderBy: { visitDate: 'desc' }
                }
            }
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        // Get service details
        const serviceIdsToFetch = normalizedServices.map((s) => s.serviceId);
        const serviceDetails = await database_1.prisma.service.findMany({
            where: { id: { in: serviceIdsToFetch }, isActive: true }
        });
        if (serviceDetails.length !== serviceIdsToFetch.length) {
            res.status(400).json({ error: 'One or more services not found or inactive' });
            return;
        }
        // Calculate total amount and prepare visit services
        let totalAmount = 0;
        const visitServices = [];
        for (const service of normalizedServices) {
            const serviceDetail = serviceDetails.find(s => s.id === service.serviceId);
            if (!serviceDetail)
                continue;
            let unitPrice = 0;
            if (service.isChild) {
                unitPrice = service.isCombined
                    ? Number(serviceDetail.childCombinedPrice || serviceDetail.childPrice || serviceDetail.singlePrice)
                    : Number(serviceDetail.childPrice || serviceDetail.singlePrice);
            }
            else {
                unitPrice = service.isCombined
                    ? Number(serviceDetail.combinedPrice || serviceDetail.singlePrice)
                    : Number(serviceDetail.singlePrice);
            }
            const lineTotal = unitPrice * service.quantity;
            totalAmount += lineTotal;
            visitServices.push({
                serviceId: service.serviceId,
                quantity: service.quantity,
                unitPrice,
                totalPrice: lineTotal,
                isChild: service.isChild,
                isCombined: service.isCombined
            });
        }
        // Calculate discounts
        const discounts = await calculateDiscounts(customer, normalizedServices, serviceDetails, totalAmount);
        const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
        const finalAmount = Math.max(0, totalAmount - totalDiscountAmount);
        // Calculate loyalty points (1 point per 1000 RWF spent)
        const loyaltyPointsEarned = Math.floor(finalAmount / 1000);
        // Create visit in transaction
        const result = await database_1.prisma.$transaction(async (tx) => {
            // Create visit
            const visit = await tx.visit.create({
                data: {
                    customerId,
                    totalAmount,
                    discountAmount: totalDiscountAmount,
                    finalAmount,
                    loyaltyPointsEarned,
                    notes,
                    createdById: req.user.id
                }
            });
            // Create visit services
            await tx.visitService.createMany({
                data: visitServices.map(vs => ({
                    visitId: visit.id,
                    ...vs
                }))
            });
            // Create visit staff relationships
            if (staffIds && Array.isArray(staffIds) && staffIds.length > 0) {
                await tx.visitStaff.createMany({
                    data: staffIds.map((staffId) => ({
                        visitId: visit.id,
                        staffId
                    }))
                });
            }
            // Create discount records
            for (const discount of discounts) {
                let discountRule = await tx.discountRule.findFirst({
                    where: { type: discount.type, isActive: true }
                });
                if (!discountRule) {
                    // Create discount rule if it doesn't exist
                    discountRule = await tx.discountRule.create({
                        data: {
                            name: discount.description,
                            type: discount.type,
                            value: discount.type === 'SERVICE_COMBO' ? 2000 : 20,
                            isPercentage: discount.type !== 'SERVICE_COMBO',
                            description: discount.description
                        }
                    });
                }
                await tx.visitDiscount.create({
                    data: {
                        visitId: visit.id,
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
                    visitCount: { increment: 1 },
                    loyaltyPoints: { increment: loyaltyPointsEarned },
                    totalSpent: { increment: finalAmount },
                    lastVisit: new Date()
                }
            });
            return visit;
        });
        // Fetch complete visit data to return
        const completeVisit = await database_1.prisma.visit.findUnique({
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
            data: completeVisit,
            message: 'Visit recorded successfully'
        });
    }
    catch (error) {
        console.error('Create visit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createVisit = createVisit;
async function calculateDiscounts(customer, services, serviceDetails, totalAmount) {
    const discounts = [];
    const currentMonth = new Date().getMonth() + 1;
    // 1. Sixth visit discount (20%)
    const newVisitCount = customer.visitCount + 1;
    if (newVisitCount % 6 === 0) {
        discounts.push({
            type: 'SIXTH_VISIT',
            amount: Math.round(totalAmount * 0.2),
            description: '6th Visit Discount (20%)'
        });
    }
    // 2. Birthday month discount (20%)
    if (customer.birthMonth === currentMonth) {
        // Check if customer hasn't used birthday discount this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        const existingBirthdayDiscount = await database_1.prisma.customerDiscount.findFirst({
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
    return discounts;
}
const getAllVisits = async (req, res) => {
    try {
        const { page = '1', limit = '10', customerId, staffId, startDate, endDate } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = {};
        if (customerId) {
            whereClause.customerId = customerId;
        }
        if (staffId) {
            whereClause.staff = {
                some: { staffId }
            };
        }
        if (startDate || endDate) {
            whereClause.visitDate = {};
            if (startDate) {
                whereClause.visitDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.visitDate.lte = new Date(endDate);
            }
        }
        const [visits, total] = await Promise.all([
            database_1.prisma.visit.findMany({
                where: whereClause,
                skip,
                take: limitNum,
                orderBy: { visitDate: 'desc' },
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
            database_1.prisma.visit.count({ where: whereClause })
        ]);
        res.json({
            success: true,
            data: {
                visits,
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
        console.error('Get visits error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllVisits = getAllVisits;
const getVisitById = async (req, res) => {
    try {
        const { id } = req.params;
        const visit = await database_1.prisma.visit.findUnique({
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
        if (!visit) {
            res.status(404).json({ error: 'Visit not found' });
            return;
        }
        res.json({
            success: true,
            data: visit
        });
    }
    catch (error) {
        console.error('Get visit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getVisitById = getVisitById;
const updateVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const { services, staffIds, notes, isCompleted } = req.body;
        const existingVisit = await database_1.prisma.visit.findUnique({ where: { id } });
        if (!existingVisit) {
            res.status(404).json({ error: 'Visit not found' });
            return;
        }
        await database_1.prisma.$transaction(async (tx) => {
            // Update services if provided
            if (Array.isArray(services)) {
                // Delete existing visit services and recalc totals
                await tx.visitService.deleteMany({ where: { visitId: id } });
                if (services.length > 0) {
                    const serviceIds = services.map((s) => s.serviceId);
                    const serviceDetails = await tx.service.findMany({ where: { id: { in: serviceIds } } });
                    let totalAmount = 0;
                    const visitServices = [];
                    for (const service of services) {
                        const detail = serviceDetails.find(s => s.id === service.serviceId);
                        if (!detail)
                            continue;
                        let unitPrice = 0;
                        if (service.isChild) {
                            unitPrice = service.isCombined
                                ? Number(detail.childCombinedPrice || detail.childPrice || detail.singlePrice)
                                : Number(detail.childPrice || detail.singlePrice);
                        }
                        else {
                            unitPrice = service.isCombined
                                ? Number(detail.combinedPrice || detail.singlePrice)
                                : Number(detail.singlePrice);
                        }
                        const lineTotal = unitPrice * (service.quantity || 1);
                        totalAmount += lineTotal;
                        visitServices.push({
                            visitId: id,
                            serviceId: service.serviceId,
                            quantity: service.quantity || 1,
                            unitPrice,
                            totalPrice: lineTotal,
                            isChild: !!service.isChild,
                            isCombined: !!service.isCombined
                        });
                    }
                    await tx.visitService.createMany({ data: visitServices });
                    // Recalculate discounts
                    const customer = await tx.customer.findUnique({ where: { id: existingVisit.customerId } });
                    const discounts = await calculateDiscounts(customer, services, serviceDetails, totalAmount);
                    const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
                    const finalAmount = Math.max(0, totalAmount - totalDiscountAmount);
                    const loyaltyPointsEarned = Math.floor(finalAmount / 1000);
                    await tx.visit.update({
                        where: { id },
                        data: {
                            totalAmount,
                            discountAmount: totalDiscountAmount,
                            finalAmount,
                            loyaltyPointsEarned
                        }
                    });
                    // Refresh discounts: delete and recreate
                    await tx.visitDiscount.deleteMany({ where: { visitId: id } });
                    for (const discount of discounts) {
                        let discountRule = await tx.discountRule.findFirst({ where: { type: discount.type, isActive: true } });
                        if (!discountRule) {
                            discountRule = await tx.discountRule.create({
                                data: {
                                    name: discount.description,
                                    type: discount.type,
                                    value: discount.type === 'SERVICE_COMBO' ? 2000 : 20,
                                    isPercentage: discount.type !== 'SERVICE_COMBO',
                                    description: discount.description
                                }
                            });
                        }
                        await tx.visitDiscount.create({
                            data: { visitId: id, discountRuleId: discountRule.id, discountAmount: discount.amount }
                        });
                    }
                }
            }
            // Update staff if provided
            if (Array.isArray(staffIds)) {
                await tx.visitStaff.deleteMany({ where: { visitId: id } });
                if (staffIds.length > 0) {
                    await tx.visitStaff.createMany({ data: staffIds.map((sid) => ({ visitId: id, staffId: sid })) });
                }
            }
            // Update basic fields
            const updateData = {};
            if (notes !== undefined)
                updateData.notes = notes;
            if (isCompleted !== undefined)
                updateData.isCompleted = !!isCompleted;
            if (Object.keys(updateData).length > 0) {
                await tx.visit.update({ where: { id }, data: updateData });
            }
        });
        const updated = await database_1.prisma.visit.findUnique({
            where: { id },
            include: {
                customer: true,
                services: { include: { service: true } },
                staff: { include: { staff: { select: { id: true, name: true } } } },
                discounts: { include: { discountRule: true } }
            }
        });
        res.json({ success: true, data: updated, message: 'Visit updated successfully' });
    }
    catch (error) {
        console.error('Update visit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateVisit = updateVisit;
const deleteVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const existingVisit = await database_1.prisma.visit.findUnique({ where: { id } });
        if (!existingVisit) {
            res.status(404).json({ error: 'Visit not found' });
            return;
        }
        await database_1.prisma.$transaction(async (tx) => {
            await tx.visitDiscount.deleteMany({ where: { visitId: id } });
            await tx.visitStaff.deleteMany({ where: { visitId: id } });
            await tx.visitService.deleteMany({ where: { visitId: id } });
            await tx.visit.delete({ where: { id } });
        });
        res.json({ success: true, message: 'Visit deleted successfully' });
    }
    catch (error) {
        console.error('Delete visit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteVisit = deleteVisit;
const completeVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const visit = await database_1.prisma.visit.update({ where: { id }, data: { isCompleted: true } });
        res.json({ success: true, data: visit, message: 'Visit marked as completed' });
    }
    catch (error) {
        console.error('Complete visit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.completeVisit = completeVisit;
const getVisitsSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate || endDate) {
            where.visitDate = {};
            if (startDate)
                where.visitDate.gte = new Date(startDate);
            if (endDate)
                where.visitDate.lte = new Date(endDate);
        }
        const [count, agg] = await Promise.all([
            database_1.prisma.visit.count({ where }),
            database_1.prisma.visit.aggregate({ where, _sum: { discountAmount: true, finalAmount: true } })
        ]);
        const totalRevenue = Number(agg._sum.finalAmount || 0);
        const totalDiscounts = Number(agg._sum.discountAmount || 0);
        const averageVisitValue = count > 0 ? totalRevenue / count : 0;
        res.json({
            success: true,
            data: {
                totalVisits: count,
                totalRevenue,
                totalDiscounts,
                averageVisitValue
            }
        });
    }
    catch (error) {
        console.error('Get visits summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getVisitsSummary = getVisitsSummary;
const getVisitsByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [visits, total] = await Promise.all([
            database_1.prisma.visit.findMany({
                where: { customerId },
                skip,
                take: limitNum,
                orderBy: { visitDate: 'desc' },
                include: {
                    services: { include: { service: true } },
                    staff: { include: { staff: { select: { id: true, name: true } } } }
                }
            }),
            database_1.prisma.visit.count({ where: { customerId } })
        ]);
        res.json({
            success: true,
            data: visits,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Get visits by customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getVisitsByCustomer = getVisitsByCustomer;
//# sourceMappingURL=visitController.js.map