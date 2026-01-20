import { Request, Response } from 'express';
import { prisma } from '../utils/database';

export const getNotifications = async (req: Request | any, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 notifications
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const createNotification = async (req: Request | any, res: Response) => {
    try {
        const userId = req.user?.id;
        const { type, title, message } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message
            }
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

export const markAllAsRead = async (req: Request | any, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'User not authenticated' });

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
};

export const clearHistory = async (req: Request | any, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'User not authenticated' });

        await prisma.notification.deleteMany({
            where: { userId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
};
