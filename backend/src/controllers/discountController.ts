import { Request, Response } from 'express';
import { prisma } from '../utils/database';

export const getAllDiscountRules = async (req: Request, res: Response) => {
    try {
        const rules = await prisma.discountRule.findMany({
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
    } catch (error) {
        console.error('Get discounts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createDiscountRule = async (req: Request, res: Response) => {
    console.log('[CreateDiscount] Received body:', JSON.stringify(req.body, null, 2));
    try {
        const {
            name,
            type,
            value,
            isPercentage,
            description,
            startDate,
            endDate,
            applyToAllServices,
            serviceIds
        } = req.body;

        const discountRule = await prisma.discountRule.create({
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
                    connect: serviceIds.map((id: string) => ({ id }))
                } : undefined
            },
            include: {
                services: true
            }
        });

        console.log('[CreateDiscount] Created successfully:', discountRule.id);
        res.status(201).json(discountRule);
    } catch (error: any) {
        console.error('[CreateDiscount] Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'A discount rule with this name already exists.' });
        } else {
            res.status(500).json({ error: 'Internal server error: ' + error.message });
        }
    }
};

export const updateDiscountRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            type,
            value,
            isPercentage,
            description,
            startDate,
            endDate,
            applyToAllServices,
            serviceIds,
            isActive
        } = req.body;

        // Separate transaction to handle service updates
        const discountRule = await prisma.discountRule.update({
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
                    connect: serviceIds && !applyToAllServices ? serviceIds.map((sid: string) => ({ id: sid })) : []
                }
            },
            include: {
                services: true
            }
        });

        res.json(discountRule);
    } catch (error: any) {
        console.error('Update discount error:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'A discount rule with this name already exists.' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const deleteDiscountRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Find the discount first to get its name
        const discount = await prisma.discountRule.findUnique({ where: { id } });

        if (!discount) {
            res.status(404).json({ error: 'Discount not found' });
            return;
        }

        // Soft delete: set isActive to false AND rename to free up the name
        // We append a timestamp to ensure uniqueness of the deleted record
        await prisma.discountRule.update({
            where: { id },
            data: {
                isActive: false,
                name: `${discount.name}_deleted_${Date.now()}`
            }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Delete discount error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const notifyCustomers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { customerIds, message } = req.body;

        if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
            res.status(400).json({ error: 'No customers selected' });
            return;
        }

        const discount = await prisma.discountRule.findUnique({ where: { id } });
        if (!discount) {
            res.status(404).json({ error: 'Discount not found' });
            return;
        }

        // Fetch customers to get phone numbers
        const customers = await prisma.customer.findMany({
            where: {
                id: { in: customerIds },
                phone: { not: null }
            },
            select: { id: true, fullName: true, phone: true }
        });

        // In a real scenario, we would use a queue for bulk sending.
        // For now, we'll process them in a loop with the existing service.
        // We'll import the smsService generically for now.
        const { smsService } = await import('../services/smsService');

        let sentCount = 0;
        let failedCount = 0;

        for (const customer of customers) {
            if (customer.phone) {
                // Personalize message if needed, or just send raw message
                // If message contains {name}, replace it
                const personalizedMessage = message.replace('{name}', customer.fullName.split(' ')[0]);

                try {
                    const success = await smsService.sendSMS(customer.phone, personalizedMessage);
                    if (success) sentCount++;
                    else failedCount++;
                } catch (e) {
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

    } catch (error) {
        console.error('Notify error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
