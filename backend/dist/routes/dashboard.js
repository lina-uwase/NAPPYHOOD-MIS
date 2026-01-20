"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalRevenue:
 *           type: number
 *         totalCustomers:
 *           type: integer
 *         totalSales:
 *           type: integer
 *         totalServices:
 *           type: integer
 *         monthlyRevenue:
 *           type: number
 *         monthlyGrowth:
 *           type: number
 *         topServices:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               revenue:
 *                 type: number
 *               count:
 *                 type: integer
 *         recentSales:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               customerName:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *     RevenueAnalytics:
 *       type: object
 *       properties:
 *         dailyRevenue:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               revenue:
 *                 type: number
 *               sales:
 *                 type: integer
 *         monthlyRevenue:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *               revenue:
 *                 type: number
 *               sales:
 *                 type: integer
 *         servicePerformance:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               serviceName:
 *                 type: string
 *               revenue:
 *                 type: number
 *               count:
 *                 type: integer
 *               percentage:
 *                 type: number
 */
/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin/Manager only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
 *         description: Time period for statistics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager access required
 */
/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get revenue analytics (Admin/Manager only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, monthly, yearly]
 *           default: monthly
 *         description: Analytics period granularity
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: Filter by specific service
 *     responses:
 *       200:
 *         description: Revenue analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RevenueAnalytics'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Manager access required
 */
// Dashboard routes (admin and manager access)
router.get('/stats', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), dashboardController_1.getDashboardStats);
router.get('/analytics', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), dashboardController_1.getRevenueAnalytics);
exports.default = router;
//# sourceMappingURL=dashboard.js.map