"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyCustomers = exports.deleteDiscountRule = exports.updateDiscountRule = exports.createDiscountRule = exports.getAllDiscountRules = void 0;
const database_1 = require("../utils/database");
const getAllDiscountRules = async (req, res) => {
    try {
        const rules = await database_1.prisma.discountRule.findMany({
            where: {
                name: { not: { contains: '_deleted_' } }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                services: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.json(rules);
    }
    catch (error) {
        console.error('Get discounts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllDiscountRules = getAllDiscountRules;
const createDiscountRule = async (req, res) => {
    console.log('[CreateDiscount] Received body:', JSON.stringify(req.body, null, 2));
    try {
        const { name, type, value, isPercentage, description, startDate, endDate, applyToAllServices, serviceIds } = req.body;
        const discountRule = await database_1.prisma.discountRule.create({
            data: {
                name,
                type,
                value,
                isPercentage,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                applyToAllServices: applyToAllServices || false,
                services: serviceIds && serviceIds.length > 0 && !applyToAllServices ? {
                    connect: serviceIds.map((id) => ({ id }))
                } : undefined
            },
            include: {
                services: true
            }
        });
        console.log('[CreateDiscount] Created successfully:', discountRule.id);
        res.status(201).json(discountRule);
    }
    catch (error) {
        console.error('[CreateDiscount] Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'A discount rule with this name already exists.' });
        }
        else {
            res.status(500).json({ error: 'Internal server error: ' + error.message });
        }
    }
};
exports.createDiscountRule = createDiscountRule;
const updateDiscountRule = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, type, value, isPercentage, description, startDate, endDate, applyToAllServices, serviceIds, isActive } = req.body;
        // Separate transaction to handle service updates
        const discountRule = await database_1.prisma.discountRule.update({
            where: { id },
            data: {
                name,
                type,
                value,
                isPercentage,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                applyToAllServices,
                isActive,
                services: {
                    set: [], // Clear existing
                    connect: serviceIds && !applyToAllServices ? serviceIds.map((sid) => ({ id: sid })) : []
                }
            },
            include: {
                services: true
            }
        });
        res.json(discountRule);
    }
    catch (error) {
        console.error('Update discount error:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'A discount rule with this name already exists.' });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.updateDiscountRule = updateDiscountRule;
const deleteDiscountRule = async (req, res) => {
    try {
        const id = req.params.id;
        // Find the discount first to get its name
        const discount = await database_1.prisma.discountRule.findUnique({ where: { id } });
        if (!discount) {
            res.status(404).json({ error: 'Discount not found' });
            return;
        }
        // Soft delete: set isActive to false AND rename to free up the name
        // We append a timestamp to ensure uniqueness of the deleted record
        await database_1.prisma.discountRule.update({
            where: { id },
            data: {
                isActive: false,
                name: `${discount.name}_deleted_${Date.now()}`
            }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete discount error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteDiscountRule = deleteDiscountRule;
const notifyCustomers = async (req, res) => {
    try {
        const id = req.params.id;
        const { customerIds, message } = req.body;
        if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
            res.status(400).json({ error: 'No customers selected' });
            return;
        }
        const discount = await database_1.prisma.discountRule.findUnique({ where: { id } });
        if (!discount) {
            res.status(404).json({ error: 'Discount not found' });
            return;
        }
        // Fetch customers to get phone numbers
        const customers = await database_1.prisma.customer.findMany({
            where: {
                id: { in: customerIds },
                phone: { not: null }
            },
            select: { id: true, fullName: true, phone: true }
        });
        // In a real scenario, we would use a queue for bulk sending.
        // For now, we'll process them in a loop with the existing service.
        // We'll import the smsService generically for now.
        const { smsService } = await Promise.resolve().then(() => __importStar(require('../services/smsService')));
        let sentCount = 0;
        let failedCount = 0;
        for (const customer of customers) {
            if (customer.phone) {
                // Personalize message if needed, or just send raw message
                // If message contains {name}, replace it
                const personalizedMessage = message.replace('{name}', customer.fullName.split(' ')[0]);
                try {
                    const success = await smsService.sendSMS(customer.phone, personalizedMessage);
                    if (success)
                        sentCount++;
                    else
                        failedCount++;
                }
                catch (e) {
                    console.error(`Failed to send to ${customer.phone}`, e);
                    failedCount++;
                }
            }
        }
        res.json({
            success: true,
            message: `Processed ${customers.length} customers`,
            stats: { sent: sentCount, failed: failedCount }
        });
    }
    catch (error) {
        console.error('Notify error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.notifyCustomers = notifyCustomers;
//# sourceMappingURL=discountController.js.map