"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearHistory = exports.markAllAsRead = exports.markAsRead = exports.createNotification = exports.getNotifications = void 0;
const database_1 = require("../utils/database");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const notifications = await database_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 notifications
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
const createNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { type, title, message } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const notification = await database_1.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message
            }
        });
        res.status(201).json(notification);
    }
    catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};
exports.createNotification = createNotification;
const markAsRead = async (req, res) => {
    try {
        const id = req.params.id;
        await database_1.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'User not authenticated' });
        await database_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
};
exports.markAllAsRead = markAllAsRead;
const clearHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'User not authenticated' });
        await database_1.prisma.notification.deleteMany({
            where: { userId }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
};
exports.clearHistory = clearHistory;
//# sourceMappingURL=notificationController.js.map