import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics
} from '../controllers/dashboardController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Dashboard routes (admin and manager access)
router.get('/stats', authenticateToken, requireRole(['ADMIN', 'MANAGER']), getDashboardStats);
router.get('/analytics', authenticateToken, requireRole(['ADMIN', 'MANAGER']), getRevenueAnalytics);

export default router;