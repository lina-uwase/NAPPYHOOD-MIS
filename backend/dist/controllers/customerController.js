"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiscountEligibility = exports.getCustomerStats = exports.getTopCustomers = exports.toggleCustomerActive = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
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
        const transformedCustomers = customers.map((customer) => ({
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
                    currentPage: pageNum,
                    page: pageNum, // Keep for backward compatibility
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    pages: Math.ceil(total / limitNum) // Keep for backward compatibility
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
        let { fullName, gender, location, district, sector, province, additionalLocation, birthDay, birthMonth, birthYear, isDependent, parentId, saleCount } = req.body;
        let phone = req.body.phone;
        let email = req.body.email;
        console.log('🔢 saleCount received:', { saleCount, type: typeof saleCount });
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
        // Validate phone number format if provided
        if (phone) {
            const { isValidPhoneNumber } = require('../utils/passwordGenerator');
            if (!isValidPhoneNumber(phone)) {
                res.status(400).json({ error: 'Invalid phone number format. Please include country code (e.g., +250788123456)' });
                return;
            }
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
            console.log('🔍 Checking phone uniqueness for:', phone);
            const existingCustomer = await database_1.prisma.customer.findFirst({
                where: {
                    phone: phone,
                    isDependent: false,
                    isActive: true // Only check against active customers
                }
            });
            if (existingCustomer) {
                console.log('❌ Phone number already exists:', { phone, existingCustomer: existingCustomer.id });
                res.status(400).json({ error: `Customer with this phone number already exists: ${existingCustomer.fullName}` });
                return;
            }
            console.log('✅ Phone number is unique');
        }
        // Check if customer with email already exists (only for non-dependent customers or dependent customers with custom email)
        if (email && !isDependent) {
            console.log('📧 Checking email uniqueness for:', email);
            const existingCustomer = await database_1.prisma.customer.findFirst({
                where: {
                    email,
                    isActive: true // Only check against active customers
                }
            });
            if (existingCustomer) {
                console.log('❌ Email already exists:', { email, existingCustomer: existingCustomer.id });
                res.status(400).json({ error: `Customer with this email already exists: ${existingCustomer.fullName}` });
                return;
            }
            console.log('✅ Email is unique');
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
        // Capitalize first letter of each name
        const capitalizeName = (name) => {
            return name
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        };
        const capitalizedFullName = capitalizeName(fullName.trim());
        console.log('🚀 Creating customer with data:', {
            fullName: capitalizedFullName,
            gender,
            location,
            district,
            sector: sector || null,
            province,
            additionalLocation: additionalLocation || null,
            phone: phone || null,
            email: email || null,
            birthDay: parseInt(birthDay),
            birthMonth: parseInt(birthMonth),
            birthYear: birthYear ? parseInt(birthYear) : null,
            isDependent: isDependent || false,
            parentId: isDependent ? parentId : null,
            saleCount: parseInt(saleCount) || 0
        });
        const customer = await database_1.prisma.customer.create({
            data: {
                fullName: capitalizedFullName,
                gender,
                location,
                district,
                sector: sector || null,
                province,
                additionalLocation: additionalLocation || null,
                phone: phone || null,
                email: email || null,
                birthDay: parseInt(birthDay),
                birthMonth: parseInt(birthMonth),
                birthYear: birthYear ? parseInt(birthYear) : null,
                isDependent: isDependent || false,
                parentId: isDependent ? parentId : null,
                saleCount: parseInt(saleCount) || 0 // Use provided visit count or default to 0
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
        let { fullName, gender, location, district, sector, province, additionalLocation, phone, email, birthDay, birthMonth, birthYear, isDependent, parentId, saleCount } = req.body;
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
                    isActive: true, // Only check against active customers
                    id: { not: id } // Exclude current customer
                }
            });
            if (phoneExists) {
                res.status(400).json({ error: 'Customer with this phone number already exists' });
                return;
            }
        }
        // Check email uniqueness if email is being changed
        if (email && email !== existingCustomer.email) {
            const emailExists = await database_1.prisma.customer.findFirst({
                where: {
                    email: email,
                    isActive: true, // Only check against active customers
                    id: { not: id } // Exclude current customer
                }
            });
            if (emailExists) {
                res.status(400).json({ error: 'Customer with this email already exists' });
                return;
            }
        }
        // Capitalize first letter of each name if fullName is being updated
        const capitalizeName = (name) => {
            return name
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        };
        const updateData = {};
        if (fullName !== undefined)
            updateData.fullName = capitalizeName(fullName.trim());
        if (gender !== undefined)
            updateData.gender = gender;
        if (location !== undefined)
            updateData.location = location;
        if (district !== undefined)
            updateData.district = district;
        if (sector !== undefined)
            updateData.sector = sector || null;
        if (province !== undefined)
            updateData.province = province;
        if (additionalLocation !== undefined)
            updateData.additionalLocation = additionalLocation || null;
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
        if (saleCount !== undefined)
            updateData.saleCount = parseInt(saleCount) || 0;
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
        console.log('🗑️ DELETE CUSTOMER FUNCTION CALLED - START');
        console.log('🔍 Request params:', req.params);
        console.log('🔍 Request user:', req.user);
        console.log('🗑️ Delete customer request received for ID:', req.params.id);
        const { id } = req.params;
        if (!id) {
            console.log('❌ No ID provided');
            res.status(400).json({ error: 'Customer ID is required' });
            return;
        }
        console.log('📋 Searching for customer with ID:', id);
        const existingCustomer = await database_1.prisma.customer.findUnique({ where: { id } });
        if (!existingCustomer) {
            console.log('❌ Customer not found:', id);
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        console.log('👤 Found customer to delete:', {
            id: existingCustomer.id,
            name: existingCustomer.fullName,
            phone: existingCustomer.phone
        });
        // Check if customer has any sales records
        const salesCount = await database_1.prisma.sale.count({
            where: { customerId: id }
        });
        if (salesCount > 0) {
            console.log('⚠️ Customer has sales records, cannot delete');
            res.status(400).json({
                error: 'Cannot delete customer with existing sales records. Customer has been deactivated instead.',
                hasActiveRecords: true
            });
            // Deactivate instead of delete if has sales
            // Reset spending and sales data when deactivating
            await database_1.prisma.customer.update({
                where: { id },
                data: {
                    isActive: false,
                    totalSpent: 0,
                    saleCount: 0,
                    loyaltyPoints: 0,
                    lastSale: null
                }
            });
            return;
        }
        // Delete customer discounts first (foreign key constraint)
        await database_1.prisma.customerDiscount.deleteMany({
            where: { customerId: id }
        });
        console.log('🔄 Attempting to permanently delete customer...');
        await database_1.prisma.customer.delete({
            where: { id }
        });
        console.log('✅ Customer deleted permanently:', id);
        res.json({
            success: true,
            message: 'Customer deleted successfully',
            data: { id, deleted: true }
        });
        console.log('📤 Response sent successfully');
    }
    catch (error) {
        console.error('❌ Delete customer error - FULL DETAILS:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
const getDiscountEligibility = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await database_1.prisma.customer.findUnique({
            where: { id },
            include: {
                discounts: {
                    where: {
                        discountRule: {
                            type: 'BIRTHDAY_MONTH'
                        }
                    },
                    orderBy: { usedAt: 'desc' },
                    take: 1
                }
            }
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        const currentMonth = new Date().getMonth() + 1;
        const isBirthdayMonth = customer.birthMonth === currentMonth;
        const nextSaleCount = customer.saleCount + 1;
        const sixthVisitEligible = nextSaleCount % 6 === 0;
        // Check if birthday discount was used this month
        let birthdayDiscountUsed = false;
        if (isBirthdayMonth && customer.discounts.length > 0) {
            const lastBirthdayDiscount = customer.discounts[0];
            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);
            if (lastBirthdayDiscount.usedAt >= thisMonth) {
                birthdayDiscountUsed = true;
            }
        }
        // Birthday discount is only available if customer has at least 1 sale (more than 0 sales)
        const hasAtLeastOneSale = customer.saleCount >= 1;
        const birthdayDiscountAvailable = isBirthdayMonth && !birthdayDiscountUsed && hasAtLeastOneSale;
        res.json({
            success: true,
            data: {
                sixthVisitEligible,
                isBirthdayMonth,
                birthdayDiscountAvailable,
                birthdayDiscountUsed,
                nextSaleCount
            }
        });
    }
    catch (error) {
        console.error('Get discount eligibility error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDiscountEligibility = getDiscountEligibility;
//# sourceMappingURL=customerController.js.map