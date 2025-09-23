import { Router } from 'express';
import {
  getAllStaff,
  getStaffById,
  getStaffPerformance,
  getAllStaffPerformance,
  updateStaff
} from '../controllers/staffController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.get('/', authenticateToken, getAllStaff);
router.get('/performance', authenticateToken, requireRole(['ADMIN', 'MANAGER']), getAllStaffPerformance);
router.get('/:id', authenticateToken, getStaffById);
router.get('/:id/performance', authenticateToken, requireRole(['ADMIN', 'MANAGER']), getStaffPerformance);
router.put('/:id', authenticateToken, requireRole(['ADMIN']), updateStaff);

export default router;