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

/**
 * @swagger
 * components:
 *   schemas:
 *     Staff:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, MANAGER, STAFF]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     StaffPerformance:
 *       type: object
 *       properties:
 *         staffId:
 *           type: string
 *         staffName:
 *           type: string
 *         totalSales:
 *           type: number
 *         totalCustomers:
 *           type: integer
 *         averageRating:
 *           type: number
 *         period:
 *           type: string
 */

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff members
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of staff members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Staff'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/staff/performance:
 *   get:
 *     summary: Get performance data for all staff (Admin/Manager only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for performance period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for performance period
 *     responses:
 *       200:
 *         description: Staff performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StaffPerformance'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager access required
 */

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff member by ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     responses:
 *       200:
 *         description: Staff member details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Staff member not found
 *   put:
 *     summary: Update staff member (Admin only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               names:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, STAFF]
 *           example:
 *             names: John Doe
 *             phone: "+250788123456"
 *             role: STAFF
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Staff member not found
 */

/**
 * @swagger
 * /api/staff/{id}/performance:
 *   get:
 *     summary: Get performance data for specific staff member (Admin/Manager only)
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for performance period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for performance period
 *     responses:
 *       200:
 *         description: Staff performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StaffPerformance'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager access required
 *       404:
 *         description: Staff member not found
 */

// All routes require authentication
router.get('/', authenticateToken, getAllStaff);
router.get('/performance', authenticateToken, requireRole(['ADMIN', 'MANAGER']), getAllStaffPerformance);
router.get('/:id', authenticateToken, getStaffById);
router.get('/:id/performance', authenticateToken, requireRole(['ADMIN', 'MANAGER']), getStaffPerformance);
router.put('/:id', authenticateToken, requireRole(['ADMIN']), updateStaff);

export default router;