import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    clearHistory
} from '../controllers/notificationController';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/', clearHistory);

export default router;
