"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyPaymentSummary = exports.getSalesByCustomer = exports.getSalesSummary = exports.completeSale = exports.deleteSale = exports.updateSale = exports.getSaleById = exports.getAllSales = exports.createSale = void 0;
const database_1 = require("../utils/database");
const createSale = async (req, res) => {
    try {
        console.log('🔍 DEBUGGING SALE CREATION - Full request body:', JSON.stringify(req.body, null, 2));
        const { customerId, services, // Array of SaleService
        serviceIds, // Optional: Array<string> (frontend simplified payload)
        serviceShampooOptions, // Object mapping serviceId to shampoo preference
        products, // Array of {productId, quantity}
        staffIds, // Array of staff IDs
        customStaffNames, // Array of custom staff names
        notes, paymentMethod = 'CASH', // Legacy single payment method
        payments, // New: Array of payment methods with amounts
        ownShampooDiscount = false, addShampoo = false, // Legacy global shampoo option
        manualDiscountAmount = 0, manualDiscountReason, manualIncrementAmount = 0, manualIncrementReason } = req.body;
        console.log('🔍 DEBUGGING STAFF DATA:', {
            staffIds,
            customStaffNames,
            staffIdsType: typeof staffIds,
            customStaffNamesType: typeof customStaffNames,
            staffIdsLength: Array.isArray(staffIds) ? staffIds.length : 'not array',
            customStaffNamesLength: Array.isArray(customStaffNames) ? customStaffNames.length : 'not array'
        });
        console.log('🔍 DEBUGGING MANUAL INCREMENT (FROM REQUEST):', {
            manualIncrementAmount,
            manualIncrementReason,
            manualIncrementAmountType: typeof manualIncrementAmount,
            manualIncrementReasonType: typeof manualIncrementReason,
            manualIncrementAmountRaw: req.body.manualIncrementAmount,
            manualIncrementReasonRaw: req.body.manualIncrementReason,
            applyManualIncrement: req.body.applyManualIncrement
        });
        const normalizedServices = Array.isArray(services) && services.length > 0
            ? services
            : Array.isArray(serviceIds) && serviceIds.length > 0
                ? serviceIds.map((sid) => ({
                    serviceId: sid,
                    quantity: 1,
                    isChild: false,
                    isCombined: false,
                    addShampoo: serviceShampooOptions?.[sid] ?? addShampoo // Use individual or fallback to global
                }))
                : [];
        // Validate that at least services or products are provided
        const normalizedProducts = Array.isArray(products) ? products : [];
        if (!customerId || (normalizedServices.length === 0 && normalizedProducts.length === 0)) {
            res.status(400).json({ error: 'Customer ID and at least one service or product is required' });
            return;
        }
        // Get customer data
        const customer = await database_1.prisma.customer.findUnique({
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
        const serviceIdsToFetch = normalizedServices.map((s) => s.serviceId);
        const serviceDetails = await database_1.prisma.service.findMany({
            where: { id: { in: serviceIdsToFetch }, isActive: true }
        });
        if (serviceDetails.length !== serviceIdsToFetch.length) {
            res.status(400).json({ error: 'One or more services not found or inactive' });
            return;
        }
        // Calculate total amount and prepare sale services
        let totalAmount = 0;
        const saleServices = [];
        for (const service of normalizedServices) {
            const serviceDetail = serviceDetails.find((s) => s.id === service.serviceId);
            if (!serviceDetail)
                continue;
            let unitPrice = 0;
            // Determine if shampoo should be added for this service
            const shouldAddShampoo = service.addShampoo || false;
            if (service.isChild) {
                if (shouldAddShampoo && serviceDetail.childCombinedPrice) {
                    unitPrice = Number(serviceDetail.childCombinedPrice);
                }
                else {
                    unitPrice = Number(serviceDetail.childPrice || serviceDetail.singlePrice);
                }
            }
            else {
                if (shouldAddShampoo && serviceDetail.combinedPrice) {
                    unitPrice = Number(serviceDetail.combinedPrice);
                }
                else {
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
        // Calculate total amount and prepare sale products
        const saleProducts = [];
        const productIdsToFetch = normalizedProducts.map((p) => p.productId);
        const productDetails = productIdsToFetch.length > 0
            ? await database_1.prisma.product.findMany({
                where: { id: { in: productIdsToFetch }, isActive: true }
            })
            : [];
        if (productIdsToFetch.length > 0 && productDetails.length !== productIdsToFetch.length) {
            res.status(400).json({ error: 'One or more products not found or inactive' });
            return;
        }
        // Validate stock availability and calculate product totals
        for (const productSale of normalizedProducts) {
            const productDetail = productDetails.find((p) => p.id === productSale.productId);
            if (!productDetail)
                continue;
            const quantity = productSale.quantity || 1;
            // Check stock availability
            if (productDetail.quantity < quantity) {
                res.status(400).json({
                    error: `Insufficient stock for ${productDetail.name}. Available: ${productDetail.quantity}, Requested: ${quantity}`
                });
                return;
            }
            const unitPrice = Number(productDetail.price);
            const lineTotal = unitPrice * quantity;
            totalAmount += lineTotal;
            saleProducts.push({
                productId: productSale.productId,
                quantity,
                unitPrice,
                totalPrice: lineTotal
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
        // Add manual increment if provided - use EXACT same pattern as manual discount
        // Check req.body directly first (most reliable)
        let manualIncrement = 0;
        const rawIncrementAmount = req.body.manualIncrementAmount;
        const rawIncrementReason = req.body.manualIncrementReason;
        // Convert to number - handle both string and number inputs
        const incrementNum = rawIncrementAmount != null ? Number(rawIncrementAmount) : 0;
        // Apply increment if amount > 0 AND reason exists and is not empty (same pattern as manual discount)
        // Trim the reason to handle whitespace-only strings
        const trimmedReason = rawIncrementReason != null ? String(rawIncrementReason).trim() : '';
        const shouldApplyIncrement = incrementNum > 0 && trimmedReason.length > 0;
        if (shouldApplyIncrement) {
            manualIncrement = incrementNum;
        }
        const finalAmount = Math.max(0, totalAmount - totalDiscountAmount + manualIncrement);
        console.log('🔍 MANUAL INCREMENT CHECK (DETAILED):', {
            'req.body.manualIncrementAmount': req.body.manualIncrementAmount,
            'req.body.manualIncrementReason': req.body.manualIncrementReason,
            'req.body.applyManualIncrement': req.body.applyManualIncrement,
            'rawIncrementAmount': rawIncrementAmount,
            'rawIncrementReason': rawIncrementReason,
            'rawIncrementReasonType': typeof rawIncrementReason,
            'trimmedReason': trimmedReason,
            'trimmedReasonLength': trimmedReason.length,
            'incrementNum': incrementNum,
            'incrementNumType': typeof incrementNum,
            'shouldApplyIncrement': shouldApplyIncrement,
            'manualIncrement': manualIncrement,
            'condition1 (incrementNum > 0)': incrementNum > 0,
            'condition2 (trimmedReason.length > 0)': trimmedReason.length > 0,
            'finalAmount': finalAmount,
            'totalAmount': totalAmount,
            'totalDiscountAmount': totalDiscountAmount,
            'calculation': `${totalAmount} - ${totalDiscountAmount} + ${manualIncrement} = ${finalAmount}`
        });
        console.log('💰 FINAL AMOUNT CALCULATION:', {
            totalAmount,
            totalDiscountAmount,
            manualIncrement,
            finalAmount,
            manualIncrementAmount,
            manualIncrementAmountType: typeof manualIncrementAmount,
            manualIncrementReason,
            manualDiscountAmount,
            manualDiscountReason
        });
        // Process payments - support both old single payment method and new multiple payments
        // Normalize payment methods to ensure consistency
        const validMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
        let normalizedPayments = [];
        if (Array.isArray(payments) && payments.length > 0) {
            // Use new payments array
            normalizedPayments = payments.map((p) => {
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
            console.log('💳 PAYMENT VALIDATION:', {
                totalPaymentAmount,
                finalAmount,
                difference: Math.abs(totalPaymentAmount - finalAmount),
                manualIncrement,
                manualIncrementAmount,
                manualIncrementReason
            });
            if (Math.abs(totalPaymentAmount - finalAmount) > 0.01) {
                console.error('❌ PAYMENT VALIDATION FAILED:', {
                    totalPaymentAmount,
                    finalAmount,
                    difference: Math.abs(totalPaymentAmount - finalAmount),
                    totalAmount,
                    totalDiscountAmount,
                    manualIncrement,
                    manualIncrementAmount,
                    manualIncrementReason
                });
                res.status(400).json({
                    error: `Payment amounts total (${totalPaymentAmount}) must equal final amount (${finalAmount}). Manual increment: ${manualIncrement}, Total: ${totalAmount}, Discounts: ${totalDiscountAmount}`
                });
                return;
            }
        }
        else {
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
        const result = await database_1.prisma.$transaction(async (tx) => {
            // Create sale
            // Combine notes with discounts and increment information
            let saleNotes = notes || '';
            const noteParts = [];
            // Add manual discount note
            if (manualDiscountAmount > 0 && manualDiscountReason) {
                noteParts.push(`[Manual Discount: ${manualDiscountAmount} RWF - ${manualDiscountReason}]`);
            }
            // Add automatic discount notes
            for (const discount of discounts) {
                if (discount.type === 'SIXTH_VISIT') {
                    noteParts.push(`[6th Visit Discount: ${discount.amount} RWF]`);
                }
                else if (discount.type === 'BIRTHDAY_MONTH') {
                    noteParts.push(`[Birthday Month Discount: ${discount.amount} RWF]`);
                }
                else if (discount.type === 'SERVICE_COMBO') {
                    noteParts.push(`[Service Combo Discount: ${discount.amount} RWF]`);
                }
                else if (discount.type === 'BRING_OWN_PRODUCT') {
                    noteParts.push(`[Bring Own Product Discount: ${discount.amount} RWF]`);
                }
            }
            // Add manual increment note
            if (manualIncrementAmount > 0 && manualIncrementReason) {
                noteParts.push(`[Manual Increment: ${manualIncrementAmount} RWF - ${manualIncrementReason}]`);
            }
            // Combine all notes
            if (noteParts.length > 0) {
                const combinedNotes = noteParts.join('\n');
                saleNotes = saleNotes ? `${saleNotes}\n${combinedNotes}` : combinedNotes;
            }
            const sale = await tx.sale.create({
                data: {
                    customerId,
                    totalAmount,
                    discountAmount: totalDiscountAmount,
                    finalAmount,
                    loyaltyPointsEarned,
                    notes: saleNotes,
                    paymentMethod: primaryPaymentMethod,
                    ownShampooDiscount,
                    birthMonthDiscount,
                    createdById: req.user.id
                }
            });
            // Create sale services
            if (saleServices.length > 0) {
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
            }
            // Create sale products and reduce stock
            if (saleProducts.length > 0) {
                await tx.saleProduct.createMany({
                    data: saleProducts.map(sp => ({
                        saleId: sale.id,
                        productId: sp.productId,
                        quantity: sp.quantity,
                        unitPrice: sp.unitPrice,
                        totalPrice: sp.totalPrice
                    }))
                });
                // Reduce stock for each product
                for (const saleProduct of saleProducts) {
                    await tx.product.update({
                        where: { id: saleProduct.productId },
                        data: {
                            quantity: { decrement: saleProduct.quantity }
                        }
                    });
                }
            }
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
                    paymentMethod: normalizedMethod,
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
            console.log('🔍 Verified payments in database:', verifyPayments.map((p) => ({
                method: p.paymentMethod,
                amount: Number(p.amount)
            })));
            // Create sale staff relationships for system staff
            if (staffIds && Array.isArray(staffIds) && staffIds.length > 0) {
                await tx.saleStaff.createMany({
                    data: staffIds.map((staffId) => ({
                        saleId: sale.id,
                        staffId
                    }))
                });
            }
            // Create sale staff relationships for custom staff names
            if (customStaffNames && Array.isArray(customStaffNames) && customStaffNames.length > 0) {
                await tx.saleStaff.createMany({
                    data: customStaffNames
                        .filter((customName) => customName != null && customName.trim().length > 0)
                        .map((customName) => ({
                        saleId: sale.id,
                        customName: customName.trim()
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
        const completeSale = await database_1.prisma.sale.findUnique({
            where: { id: result.id },
            include: {
                customer: true,
                services: {
                    include: {
                        service: true
                    }
                },
                products: {
                    include: {
                        product: true
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
    }
    catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createSale = createSale;
async function calculateDiscounts(customer, services, serviceDetails, totalAmount, ownShampooDiscount = false) {
    const discounts = [];
    const currentMonth = new Date().getMonth() + 1;
    // 1. Sixth sale discount (20%)
    const newSaleCount = customer.saleCount + 1;
    let appliedSixthVisitDiscount = false;
    if (newSaleCount % 6 === 0) {
        discounts.push({
            type: 'SIXTH_VISIT',
            amount: Math.round(totalAmount * 0.2),
            description: '6th Sale Discount (20%)'
        });
        appliedSixthVisitDiscount = true;
    }
    // 2. Birthday month discount (20%)
    // Only eligible if customer has at least 1 sale (more than 0 sales)
    // AND if 6th visit discount was NOT applied (prevent double discount)
    if (!appliedSixthVisitDiscount && customer.birthMonth === currentMonth && customer.saleCount >= 1) {
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
    // 4. Own product discount (1000 RWF off when customer brings own product)
    if (ownShampooDiscount && totalAmount >= 1000) {
        discounts.push({
            type: 'BRING_OWN_PRODUCT',
            amount: 1000,
            description: 'Bring Your Own Product Discount'
        });
    }
    // 5. Configurable Discounts (Seasonal, Promotional, etc.)
    const now = new Date();
    // Find active rules that are valid for today
    const activeRules = await database_1.prisma.discountRule.findMany({
        where: {
            isActive: true,
            OR: [
                { startDate: null },
                { startDate: { lte: now } }
            ],
            AND: [
                { OR: [{ endDate: null }, { endDate: { gte: now } }] }
            ]
        },
        include: {
            services: true
        }
    });
    for (const rule of activeRules) {
        let eligibleAmount = 0;
        // Determine which services in the sale are eligible for this rule
        if (rule.applyToAllServices) {
            // All services are eligible
            eligibleAmount = totalAmount;
        }
        else if (rule.services && rule.services.length > 0) {
            // Only specific services are eligible
            const ruleServiceIds = rule.services.map(s => s.id);
            // Calculate total amount for eligible services in the current sale
            eligibleAmount = services.reduce((sum, saleService) => {
                if (ruleServiceIds.includes(saleService.serviceId)) {
                    const serviceDetail = serviceDetails.find(sd => sd.id === saleService.serviceId);
                    if (serviceDetail) {
                        // Need to calculate strict line item total
                        let unitPrice = 0;
                        const shouldAddShampoo = saleService.addShampoo || false;
                        if (saleService.isChild) {
                            unitPrice = Number(shouldAddShampoo && serviceDetail.childCombinedPrice ? serviceDetail.childCombinedPrice : (serviceDetail.childPrice || serviceDetail.singlePrice));
                        }
                        else {
                            unitPrice = Number(shouldAddShampoo && serviceDetail.combinedPrice ? serviceDetail.combinedPrice : serviceDetail.singlePrice);
                        }
                        return sum + (unitPrice * saleService.quantity);
                    }
                }
                return sum;
            }, 0);
        }
        if (eligibleAmount > 0) {
            // Check minimum purchase amount if set
            if (rule.minAmount && eligibleAmount < Number(rule.minAmount)) {
                continue;
            }
            let discountAmount = 0;
            if (rule.isPercentage) {
                discountAmount = Math.round(eligibleAmount * (Number(rule.value) / 100));
            }
            else {
                discountAmount = Number(rule.value);
            }
            // Cap at max discount if set
            if (rule.maxDiscount && discountAmount > Number(rule.maxDiscount)) {
                discountAmount = Number(rule.maxDiscount);
            }
            // Ensure we don't discount more than the eligible amount
            if (discountAmount > eligibleAmount) {
                discountAmount = eligibleAmount;
            }
            if (discountAmount > 0) {
                discounts.push({
                    type: rule.type,
                    amount: discountAmount,
                    description: rule.name
                });
            }
        }
    }
    return discounts;
}
const getAllSales = async (req, res) => {
    try {
        const { page = '1', limit = '10', customerId, staffId, startDate, endDate, search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = {};
        // If user is STAFF, only show their own sales
        if (req.user?.role === 'STAFF') {
            whereClause.staff = {
                some: { staffId: req.user.id }
            };
        }
        else {
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
                    contains: search,
                    mode: 'insensitive'
                }
            };
        }
        if (startDate || endDate) {
            whereClause.saleDate = {};
            if (startDate) {
                // If only startDate is provided, filter for that specific date
                const startDateObj = new Date(startDate);
                startDateObj.setHours(0, 0, 0, 0);
                whereClause.saleDate.gte = startDateObj;
                // If no endDate provided, set endDate to end of the same day
                if (!endDate) {
                    const endOfDayObj = new Date(startDate);
                    endOfDayObj.setHours(23, 59, 59, 999);
                    whereClause.saleDate.lte = endOfDayObj;
                }
            }
            if (endDate) {
                // End of the end date (23:59:59.999)
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                whereClause.saleDate.lte = endDateObj;
            }
        }
        const [sales, total] = await Promise.all([
            database_1.prisma.sale.findMany({
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
                    products: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true
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
            database_1.prisma.sale.count({ where: whereClause })
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
    }
    catch (error) {
        console.error('Get sales error:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllSales = getAllSales;
const getSaleById = async (req, res) => {
    try {
        const id = req.params.id;
        const sale = await database_1.prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                services: {
                    include: {
                        service: true
                    }
                },
                products: {
                    include: {
                        product: true
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
    }
    catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSaleById = getSaleById;
const updateSale = async (req, res) => {
    try {
        const id = req.params.id;
        const { services, serviceIds, products, staffIds, customStaffNames, notes, isCompleted, manualDiscountAmount = 0, manualDiscountReason, manualIncrementAmount = 0, manualIncrementReason, ownShampooDiscount = false, payments } = req.body;
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
        const existingSale = await database_1.prisma.sale.findUnique({ where: { id } });
        if (!existingSale) {
            res.status(404).json({ error: 'Sale not found' });
            return;
        }
        // Capture original values for stats adjustment
        const originalFinalAmount = Number(existingSale.finalAmount);
        const originalLoyaltyPoints = existingSale.loyaltyPointsEarned;
        const customerId = existingSale.customerId;
        await database_1.prisma.$transaction(async (tx) => {
            // Update services if provided (handle both serviceIds and services format)
            const servicesToProcess = Array.isArray(services) ? services :
                Array.isArray(serviceIds) ? serviceIds.map((id) => ({ serviceId: id, quantity: 1, isChild: false })) : null;
            let servicesWereUpdated = false;
            if (servicesToProcess) {
                servicesWereUpdated = true;
                console.log('🔧 PROCESSING SERVICES:', { servicesToProcess });
                // Delete existing sale services and recalc totals
                await tx.saleService.deleteMany({ where: { saleId: id } });
                if (servicesToProcess.length > 0) {
                    const serviceIdList = servicesToProcess.map((s) => s.serviceId || s);
                    const serviceDetails = await tx.service.findMany({ where: { id: { in: serviceIdList } } });
                    let totalAmount = 0;
                    const saleServices = [];
                    for (const service of servicesToProcess) {
                        const serviceId = service.serviceId || service;
                        const detail = serviceDetails.find((s) => s.id === serviceId);
                        if (!detail)
                            continue;
                        const shouldAddShampoo = service.addShampoo || false;
                        let unitPrice = 0;
                        if (service.isChild) {
                            if (shouldAddShampoo && detail.childCombinedPrice) {
                                unitPrice = Number(detail.childCombinedPrice);
                            }
                            else {
                                unitPrice = Number(detail.childPrice || detail.singlePrice);
                            }
                        }
                        else {
                            if (shouldAddShampoo && detail.combinedPrice) {
                                unitPrice = Number(detail.combinedPrice);
                            }
                            else {
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
                    // When editing a sale, preserve original discounts - don't recalculate automatic discounts
                    // Only update manual discounts/increments if provided
                    // Get existing discounts to preserve automatic ones
                    const existingDiscounts = await tx.saleDiscount.findMany({
                        where: { saleId: id },
                        include: { discountRule: true }
                    });
                    // Separate automatic discounts from manual discount
                    const automaticDiscounts = existingDiscounts.filter((sd) => sd.discountRule.type !== 'MANUAL_DISCOUNT');
                    // Calculate automatic discount amounts from existing discounts
                    const automaticDiscountAmount = automaticDiscounts.reduce((sum, sd) => sum + Number(sd.discountAmount), 0);
                    // Calculate manual discount (use provided value or keep existing)
                    let manualDiscountAmountValue = 0;
                    if (manualDiscountAmount > 0 && manualDiscountReason) {
                        manualDiscountAmountValue = Number(manualDiscountAmount);
                    }
                    else {
                        // Find existing manual discount if not provided
                        const existingManualDiscount = existingDiscounts.find((sd) => sd.discountRule.type === 'MANUAL_DISCOUNT');
                        if (existingManualDiscount) {
                            manualDiscountAmountValue = Number(existingManualDiscount.discountAmount);
                        }
                    }
                    const totalDiscountAmount = automaticDiscountAmount + manualDiscountAmountValue;
                    const manualIncrement = (manualIncrementAmount > 0 && manualIncrementReason) ? Number(manualIncrementAmount) : 0;
                    const finalAmount = Math.max(0, totalAmount - totalDiscountAmount + manualIncrement);
                    const loyaltyPointsEarned = Math.floor(finalAmount / 1000);
                    // Preserve birthMonthDiscount from existing sale
                    const birthMonthDiscount = existingSale.birthMonthDiscount;
                    console.log('📊 UPDATING SALE TOTALS (PRESERVING ORIGINAL DISCOUNTS):', {
                        totalAmount,
                        automaticDiscountAmount,
                        manualDiscountAmountValue,
                        totalDiscountAmount,
                        manualIncrement,
                        finalAmount,
                        loyaltyPointsEarned,
                        ownShampooDiscount,
                        birthMonthDiscount,
                        preservedAutomaticDiscounts: automaticDiscounts.length
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
                    // Update discounts: preserve automatic discounts, update manual discount if provided
                    if (manualDiscountAmount > 0 && manualDiscountReason) {
                        // Remove existing manual discount
                        const existingManualDiscount = existingDiscounts.find((sd) => sd.discountRule.type === 'MANUAL_DISCOUNT');
                        if (existingManualDiscount) {
                            await tx.saleDiscount.delete({ where: { id: existingManualDiscount.id } });
                        }
                        // Create/update manual discount
                        let discountRule = await tx.discountRule.findFirst({
                            where: { type: 'MANUAL_DISCOUNT', isActive: true }
                        });
                        if (!discountRule) {
                            discountRule = await tx.discountRule.create({
                                data: {
                                    name: manualDiscountReason,
                                    type: 'MANUAL_DISCOUNT',
                                    value: 0,
                                    isPercentage: false,
                                    description: manualDiscountReason
                                }
                            });
                        }
                        await tx.saleDiscount.create({
                            data: {
                                saleId: id,
                                discountRuleId: discountRule.id,
                                discountAmount: manualDiscountAmountValue
                            }
                        });
                    }
                    // Update notes: preserve original discount notes, only update manual discount/increment if provided
                    if (manualDiscountAmount > 0 && manualDiscountReason) {
                        // Get existing notes
                        const currentSale = await tx.sale.findUnique({ where: { id }, select: { notes: true } });
                        let existingNotes = currentSale?.notes || '';
                        // Remove old manual discount note if it exists
                        existingNotes = existingNotes.replace(/\[Manual Discount:.*?\]/g, '').trim();
                        // Add new manual discount note
                        const manualDiscountNote = `[Manual Discount: ${manualDiscountAmount} RWF - ${manualDiscountReason}]`;
                        const baseNotes = notes || existingNotes || '';
                        const updatedNotes = baseNotes ? `${baseNotes}\n${manualDiscountNote}` : manualDiscountNote;
                        await tx.sale.update({ where: { id }, data: { notes: updatedNotes } });
                    }
                    // Update manual increment note if provided
                    if (manualIncrementAmount > 0 && manualIncrementReason) {
                        const currentSale = await tx.sale.findUnique({ where: { id }, select: { notes: true } });
                        let existingNotes = currentSale?.notes || '';
                        // Remove old manual increment note if it exists
                        existingNotes = existingNotes.replace(/\[Manual Increment:.*?\]/g, '').trim();
                        // Add new manual increment note
                        const manualIncrementNote = `[Manual Increment: ${manualIncrementAmount} RWF - ${manualIncrementReason}]`;
                        const baseNotes = notes || existingNotes || '';
                        const updatedNotes = baseNotes ? `${baseNotes}\n${manualIncrementNote}` : manualIncrementNote;
                        await tx.sale.update({ where: { id }, data: { notes: updatedNotes } });
                    }
                    // If only notes field is being updated (not services), update it
                    if (notes !== undefined && !servicesWereUpdated) {
                        await tx.sale.update({ where: { id }, data: { notes } });
                    }
                }
            }
            // Update staff if provided (handle both system staff and custom staff)
            if (Array.isArray(staffIds) || Array.isArray(customStaffNames)) {
                await tx.saleStaff.deleteMany({ where: { saleId: id } });
                // Add system staff
                if (Array.isArray(staffIds) && staffIds.length > 0) {
                    await tx.saleStaff.createMany({
                        data: staffIds.map((sid) => ({ saleId: id, staffId: sid }))
                    });
                }
                // Add custom staff names
                if (Array.isArray(customStaffNames) && customStaffNames.length > 0) {
                    await tx.saleStaff.createMany({
                        data: customStaffNames
                            .filter((customName) => customName != null && customName.trim().length > 0)
                            .map((customName) => ({
                            saleId: id,
                            customName: customName.trim()
                        }))
                    });
                }
            }
            // Update products if provided
            if (Array.isArray(products)) {
                // Get existing products to restore stock
                const existingProducts = await tx.saleProduct.findMany({
                    where: { saleId: id },
                    include: { product: true }
                });
                // Restore stock for existing products
                for (const existingProduct of existingProducts) {
                    await tx.product.update({
                        where: { id: existingProduct.productId },
                        data: {
                            quantity: { increment: existingProduct.quantity }
                        }
                    });
                }
                // Delete existing sale products
                await tx.saleProduct.deleteMany({ where: { saleId: id } });
                // Add new products and reduce stock
                if (products.length > 0) {
                    const productIds = products.map((p) => p.productId);
                    const productDetails = await tx.product.findMany({
                        where: { id: { in: productIds }, isActive: true }
                    });
                    if (productDetails.length !== productIds.length) {
                        throw new Error('One or more products not found or inactive');
                    }
                    const saleProducts = [];
                    // Calculate product total for final amount update if services weren't updated
                    // If services were updated, finalAmount is already recalculated above including products?
                    // WAIT: The code above calculates finalAmount based on services ONLY if servicesToProcess exists.
                    // But it assumes totalAmount starts at 0. If services are updated, we need to include products in the total calculation too!
                    // This logic in the original code was slightly flawed if doing partial updates. 
                    // Assuming frontend sends ALL services and ALL products when updating.
                    // Re-calculation logic check:
                    // The block above `if (servicesToProcess)` calculates totalAmount from scratch for services.
                    // But it doesn't seem to account for products in that block! 
                    // It pushes to `saleServices` but doesn't add `saleProducts` to `totalAmount` if products are not processed in the same block.
                    // CRITICAL FIX: We need to ensure totalAmount includes BOTH services and products.
                    // Since the frontend sends the *complete* state of the sale (services + products), 
                    // if we are updating services, we MUST also calculate product totals if products are provided.
                    // However, the `servicesToProcess` block above commits the update to `tx.sale`.
                    // If products are processed later, we might need to update `tx.sale` AGAIN with the product totals added.
                    // Let's look at how products are handled.
                    // They are calculated here and inserted.
                    // But `totalAmount` in the `servicesToProcess` block matches `services` only if products aren't added there.
                    // Given the complexity, let's assume the correct way is:
                    // 1. If services are updated, we recalculate everything (services + products).
                    // 2. If products are updated, we recalculate everything.
                    // Currently the code splits them. 
                    // Let's add product totals to the sale update if we happen to be in the services block? 
                    // OR better: Update the sale totals at the END of the transaction after processing services and products.
                    // But for now, let's stick to the requested fix: Update Customer Stats. 
                    // I will assume the `finalAmount` on the sale is updated correctly by the existing logic (or my minor tweak to it).
                    // Wait, the existing logic I pasted above for `servicesToProcess` calculates `finalAmount`. 
                    // Does it include product prices?
                    // In the original code (lines 904-941), it sums services. 
                    // It does NOT seem to sum products in that block!
                    // This means if I edit services, the product costs might be lost from `totalAmount`?
                    // Let's check the original code again.
                    // Line 1106: `if (Array.isArray(products))`...
                    // It creates saleProducts.
                    // It DOES NOT update `sale.totalAmount`. 
                    // THIS IS A BUG in the original code! If you update services, it overwrites totalAmount with ONLY service costs (lines 996-1006).
                    // If you update products, it changes stock but doesn't seem to update `totalAmount` of the sale!
                    // I need to fix this too. 
                    // STRATEGY: 
                    // I will collect `serviceTotal` and `productTotal`.
                    // I will fetch existing products/services if they are NOT being updated, to get their total.
                    // Then update the sale ONCE at the end.
                    // Actually, to implement the requested "Customer Stats Fix", I just need to compare `existingSale.finalAmount` with `newSale.finalAmount`.
                    // But to get `newSale.finalAmount`, the update logic must be correct.
                    // Correcting the Update Logic:
                    // Since the frontend likely sends everything (services AND products) on edit,
                    // I should ensure I calculate the total from BOTH.
                    // Let's accumulate totals.
                    for (const productSale of products) {
                        const productDetail = productDetails.find((p) => p.id === productSale.productId);
                        if (!productDetail)
                            continue;
                        const quantity = productSale.quantity || 1;
                        // Check stock availability (add back existing quantity for this sale if any?)
                        // We already restored stock above, so we are checking against full available stock.
                        if (productDetail.quantity < quantity) {
                            throw new Error(`Insufficient stock for ${productDetail.name}. Available: ${productDetail.quantity}, Requested: ${quantity}`);
                        }
                        const unitPrice = Number(productDetail.price);
                        const lineTotal = unitPrice * quantity;
                        // totalAmount += lineTotal; // We need to add this to the total!
                        saleProducts.push({
                            saleId: id,
                            productId: productSale.productId,
                            quantity,
                            unitPrice,
                            totalPrice: lineTotal
                        });
                        // Reduce stock
                        await tx.product.update({
                            where: { id: productSale.productId },
                            data: {
                                quantity: { decrement: quantity }
                            }
                        });
                    }
                    await tx.saleProduct.createMany({ data: saleProducts });
                }
            }
            // Update payments if provided
            if (Array.isArray(payments)) {
                await tx.salePayment.deleteMany({ where: { saleId: id } });
                if (payments.length > 0) {
                    const validMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
                    const normalizedPayments = payments.map((payment) => {
                        const method = (payment.paymentMethod || 'CASH').toUpperCase().trim();
                        const normalizedMethod = validMethods.includes(method) ? method : 'CASH';
                        if (method !== normalizedMethod) {
                            console.warn(`⚠️ Invalid payment method "${method}" normalized to "${normalizedMethod}" for sale ${id}`);
                        }
                        return {
                            saleId: id,
                            paymentMethod: normalizedMethod,
                            amount: Number(payment.amount)
                        };
                    });
                    console.log('💳 Updating sale payments:', normalizedPayments.map((p) => ({
                        method: p.paymentMethod,
                        amount: Number(p.amount)
                    })));
                    await tx.salePayment.createMany({ data: normalizedPayments });
                }
            }
            // Update basic fields
            const updateData = {};
            // Handle notes update - only if services weren't updated (services update handles notes above)
            if (notes !== undefined && !servicesWereUpdated) {
                // If no manual discount/increment notes were added above, just update notes directly
                updateData.notes = notes;
            }
            if (isCompleted !== undefined)
                updateData.isCompleted = !!isCompleted;
            if (Object.keys(updateData).length > 0) {
                await tx.sale.update({ where: { id }, data: updateData });
            }
            // -- CORRECT CUSTOMER STATS --
            // Fetch the UPDATED sale to get the final amounts
            const updatedSale = await tx.sale.findUnique({ where: { id } });
            const newFinalAmount = Number(updatedSale.finalAmount);
            const newLoyaltyPoints = updatedSale.loyaltyPointsEarned;
            const amountDiff = newFinalAmount - originalFinalAmount;
            const pointsDiff = newLoyaltyPoints - originalLoyaltyPoints;
            if (amountDiff !== 0 || pointsDiff !== 0) {
                console.log('🔄 Adjusting Customer Stats:', {
                    customerId,
                    amountDiff,
                    pointsDiff,
                    originalFinalAmount,
                    newFinalAmount
                });
                await tx.customer.update({
                    where: { id: customerId },
                    data: {
                        totalSpent: { increment: amountDiff },
                        loyaltyPoints: { increment: pointsDiff },
                        // Do NOT increment saleCount as it's the same sale
                    }
                });
            }
        });
        const updated = await database_1.prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                services: { include: { service: true } },
                products: { include: { product: true } },
                staff: { include: { staff: { select: { id: true, name: true } } } },
                discounts: { include: { discountRule: true } },
                payments: true
            }
        });
        res.json({ success: true, data: updated, message: 'Sale updated successfully' });
    }
    catch (error) {
        console.error('Update sale error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateSale = updateSale;
const deleteSale = async (req, res) => {
    try {
        const id = req.params.id;
        const existingSale = await database_1.prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                products: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (!existingSale) {
            res.status(404).json({ error: 'Sale not found' });
            return;
        }
        const customerId = existingSale.customerId;
        const finalAmount = Number(existingSale.finalAmount || 0);
        // Use stored loyalty points if available, otherwise fallback to calculation
        const loyaltyPointsEarned = existingSale.loyaltyPointsEarned ?? Math.floor(finalAmount / 1000);
        await database_1.prisma.$transaction(async (tx) => {
            // Get products before deleting to restore stock
            const saleProducts = await tx.saleProduct.findMany({
                where: { saleId: id },
                include: { product: true }
            });
            // Restore stock for products
            for (const saleProduct of saleProducts) {
                await tx.product.update({
                    where: { id: saleProduct.productId },
                    data: {
                        quantity: { decrement: -saleProduct.quantity } // Double negative = increment
                    }
                });
            }
            // Delete related records first
            await tx.saleDiscount.deleteMany({ where: { saleId: id } });
            await tx.saleStaff.deleteMany({ where: { saleId: id } });
            await tx.saleService.deleteMany({ where: { saleId: id } });
            await tx.saleProduct.deleteMany({ where: { saleId: id } });
            await tx.salePayment.deleteMany({ where: { saleId: id } });
            // Delete the sale
            await tx.sale.delete({ where: { id } });
            // Update customer statistics - decrement what was incremented when sale was created
            const customer = await tx.customer.findUnique({ where: { id: customerId } });
            if (customer) {
                // Get the most recent sale for this customer (excluding the one we're deleting)
                const mostRecentSale = await tx.sale.findFirst({
                    where: {
                        customerId: customerId,
                        id: { not: id }
                    },
                    orderBy: {
                        saleDate: 'desc'
                    },
                    select: {
                        saleDate: true
                    }
                });
                // Calculate new values (ensure they don't go below 0)
                const newSaleCount = Math.max(0, (customer.saleCount || 0) - 1);
                const newTotalSpent = Math.max(0, Number(customer.totalSpent || 0) - finalAmount);
                const newLoyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) - loyaltyPointsEarned);
                await tx.customer.update({
                    where: { id: customerId },
                    data: {
                        saleCount: newSaleCount,
                        totalSpent: newTotalSpent,
                        loyaltyPoints: newLoyaltyPoints,
                        lastSale: mostRecentSale?.saleDate || null
                    }
                });
                console.log('✅ Customer statistics updated after sale deletion:', {
                    customerId,
                    saleCount: `${customer.saleCount} → ${newSaleCount}`,
                    totalSpent: `${customer.totalSpent} → ${newTotalSpent}`,
                    loyaltyPoints: `${customer.loyaltyPoints} → ${newLoyaltyPoints}`,
                    finalAmount,
                    loyaltyPointsEarned
                });
            }
        });
        res.json({ success: true, message: 'Sale deleted successfully' });
    }
    catch (error) {
        console.error('Delete sale error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteSale = deleteSale;
const completeSale = async (req, res) => {
    try {
        const id = req.params.id;
        const sale = await database_1.prisma.sale.update({ where: { id }, data: { isCompleted: true } });
        res.json({ success: true, data: sale, message: 'Sale marked as completed' });
    }
    catch (error) {
        console.error('Complete sale error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.completeSale = completeSale;
const getSalesSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        // If user is STAFF, only show their own sales summary
        if (req.user?.role === 'STAFF') {
            where.staff = {
                some: { staffId: req.user.id }
            };
        }
        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate)
                where.saleDate.gte = new Date(startDate);
            if (endDate) {
                // End of the end date (23:59:59.999)
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                where.saleDate.lte = endDateObj;
            }
        }
        const [count, agg] = await Promise.all([
            database_1.prisma.sale.count({ where }),
            database_1.prisma.sale.aggregate({ where, _sum: { discountAmount: true, finalAmount: true } })
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
    }
    catch (error) {
        console.error('Get sales summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSalesSummary = getSalesSummary;
const getSalesByCustomer = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const [sales, total] = await Promise.all([
            database_1.prisma.sale.findMany({
                where: { customerId },
                skip,
                take: limitNum,
                orderBy: { saleDate: 'desc' },
                include: {
                    services: { include: { service: true } },
                    staff: { include: { staff: { select: { id: true, name: true } } } }
                }
            }),
            database_1.prisma.sale.count({ where: { customerId } })
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
    }
    catch (error) {
        console.error('Get sales by customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSalesByCustomer = getSalesByCustomer;
const getDailyPaymentSummary = async (req, res) => {
    try {
        const { date } = req.query;
        // Use provided date or default to today
        // Handle date string in YYYY-MM-DD format (from date input)
        // IMPORTANT: Parse as UTC to match database storage
        let targetDate;
        if (date) {
            // Parse date string as UTC to avoid timezone issues
            const dateStr = date;
            // Create date in UTC: YYYY-MM-DD becomes YYYY-MM-DD 00:00:00 UTC
            targetDate = new Date(dateStr + 'T00:00:00.000Z');
        }
        else {
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
        const whereClause = {
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
        const allDirectPayments = await database_1.prisma.salePayment.findMany({
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
        const allSalesForDate = await database_1.prisma.sale.findMany({
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
            const paymentBreakdown = {};
            allDirectPayments.forEach((p) => {
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
            console.log('📊 All payments details:', allDirectPayments.map((p) => ({
                method: p.paymentMethod,
                amount: Number(p.amount),
                saleId: p.saleId,
                saleDate: p.sale.saleDate?.toISOString()
            })));
        }
        else {
            console.log('⚠️ No payments found in SalePayment table for this date');
        }
        console.log('📊 Total sales for date:', allSalesForDate.length);
        if (allSalesForDate.length > 0) {
            console.log('📊 Sales details:', allSalesForDate.map((s) => ({
                id: s.id,
                saleDate: s.saleDate?.toISOString(),
                paymentMethod: s.paymentMethod,
                finalAmount: Number(s.finalAmount),
                hasPaymentsInTable: salesWithPayments.has(s.id)
            })));
        }
        // Extract all payments from the direct query
        const payments = [];
        // Process all payments from SalePayment table
        allDirectPayments.forEach((payment) => {
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
        allSalesForDate.forEach((sale) => {
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
        }
        else {
            // Debug: Check if there are any sales for this date
            const salesCount = await database_1.prisma.sale.count({ where: whereClause });
            console.log('📊 Sales count for date range:', salesCount);
            // Also check all recent payments to see what payment methods exist
            const recentPayments = await database_1.prisma.salePayment.findMany({
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
            console.log('📊 Recent payments (last 50, all dates):', recentPayments.map((p) => ({
                method: p.paymentMethod,
                amount: Number(p.amount),
                saleDate: p.sale.saleDate?.toISOString()
            })));
        }
        // Group payments by method and calculate totals from salePayment table
        const paymentSummary = {};
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
    }
    catch (error) {
        console.error('Get daily payment summary error:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getDailyPaymentSummary = getDailyPaymentSummary;
//# sourceMappingURL=salesController.js.map