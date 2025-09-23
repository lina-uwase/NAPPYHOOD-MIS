"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceController_1 = require("../controllers/serviceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *           enum: [HAIR_TREATMENTS, TWIST_HAIRSTYLE, CORNROWS_BRAIDS, STRAWSET_CURLS, STYLING_SERVICE, SPECIAL_OFFERS]
 *         description:
 *           type: string
 *         singlePrice:
 *           type: number
 *         combinedPrice:
 *           type: number
 *           nullable: true
 *         childPrice:
 *           type: number
 *         childCombinedPrice:
 *           type: number
 *           nullable: true
 *         duration:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         isComboEligible:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ServiceRequest:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - singlePrice
 *         - childPrice
 *         - duration
 *       properties:
 *         name:
 *           type: string
 *         category:
 *           type: string
 *           enum: [HAIR_TREATMENTS, TWIST_HAIRSTYLE, CORNROWS_BRAIDS, STRAWSET_CURLS, STYLING_SERVICE, SPECIAL_OFFERS]
 *         description:
 *           type: string
 *         singlePrice:
 *           type: number
 *         combinedPrice:
 *           type: number
 *         childPrice:
 *           type: number
 *         childCombinedPrice:
 *           type: number
 *         duration:
 *           type: integer
 *         isComboEligible:
 *           type: boolean
 */
/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [HAIR_TREATMENTS, TWIST_HAIRSTYLE, CORNROWS_BRAIDS, STRAWSET_CURLS, STYLING_SERVICE, SPECIAL_OFFERS]
 *         description: Filter by service category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Services retrieved successfully
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
 *                     $ref: '#/components/schemas/Service'
 */
router.get('/', auth_1.authenticateToken, serviceController_1.getAllServices);
/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 */
router.get('/:id', auth_1.authenticateToken, serviceController_1.getServiceById);
/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service (Admin/Manager only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceRequest'
 *           example:
 *             name: "Shampoo & Blow Dry"
 *             category: "HAIR_TREATMENTS"
 *             description: "Hair washing and styling service"
 *             singlePrice: 7000
 *             combinedPrice: 15000
 *             childPrice: 9000
 *             childCombinedPrice: 12000
 *             duration: 60
 *             isComboEligible: true
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       403:
 *         description: Forbidden - Admin/Manager access required
 */
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), serviceController_1.createService);
/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Update a service (Admin/Manager only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceRequest'
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 *       403:
 *         description: Forbidden - Admin/Manager access required
 *   delete:
 *     summary: Delete a service (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), serviceController_1.updateService);
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN']), serviceController_1.deleteService);
exports.default = router;
//# sourceMappingURL=services.js.map