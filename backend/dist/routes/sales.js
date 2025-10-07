"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const salesController_1 = require("../controllers/salesController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customerId:
 *           type: string
 *         saleDate:
 *           type: string
 *           format: date-time
 *         totalAmount:
 *           type: number
 *         discountAmount:
 *           type: number
 *         finalAmount:
 *           type: number
 *         loyaltyPointsEarned:
 *           type: integer
 *         notes:
 *           type: string
 *           nullable: true
 *         services:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: string
 *               serviceName:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               isChild:
 *                 type: boolean
 *               isCombined:
 *                 type: boolean
 *               unitPrice:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *         staff:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *         discounts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SIXTH_VISIT, BIRTHDAY_MONTH, SERVICE_COMBO, BRING_OWN_PRODUCT]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         createdAt:
 *           type: string
 *           format: date-time
 *     SaleRequest:
 *       type: object
 *       required:
 *         - customerId
 *         - services
 *         - staffIds
 *       properties:
 *         customerId:
 *           type: string
 *         services:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - serviceId
 *               - quantity
 *             properties:
 *               serviceId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               isChild:
 *                 type: boolean
 *                 default: false
 *               isCombined:
 *                 type: boolean
 *                 default: false
 *         staffIds:
 *           type: array
 *           items:
 *             type: string
 *           description: "Array of staff member IDs who provided services"
 *         notes:
 *           type: string
 *           description: "Optional sale notes"
 */
/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales with pagination and filtering
 *     tags: [Sales]
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
 *         description: Number of sales per page
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff member ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sales:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Sale'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *   post:
 *     summary: Create a new sale with automatic discount calculation
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaleRequest'
 *           example:
 *             customerId: "cm123456789"
 *             services:
 *               - serviceId: "service_id_1"
 *                 quantity: 1
 *                 isChild: false
 *                 isCombined: true
 *               - serviceId: "service_id_2"
 *                 quantity: 1
 *                 isChild: false
 *                 isCombined: false
 *             staffIds: ["staff_id_1", "staff_id_2"]
 *             notes: "Customer brought own shampoo"
 *     responses:
 *       201:
 *         description: Sale created successfully with discounts applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer or service not found
 */
router.get('/', auth_1.authenticateToken, salesController_1.getAllSales);
router.post('/', auth_1.authenticateToken, salesController_1.createSale);
router.get('/summary', auth_1.authenticateToken, salesController_1.getSalesSummary);
router.get('/customer/:customerId', auth_1.authenticateToken, salesController_1.getSalesByCustomer);
/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale details by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       404:
 *         description: Sale not found
 */
router.get('/:id', auth_1.authenticateToken, salesController_1.getSaleById);
router.put('/:id', auth_1.authenticateToken, salesController_1.updateSale);
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), salesController_1.deleteSale);
router.patch('/:id/complete', auth_1.authenticateToken, salesController_1.completeSale);
exports.default = router;
//# sourceMappingURL=sales.js.map