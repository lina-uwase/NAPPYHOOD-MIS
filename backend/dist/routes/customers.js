"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fullName:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         location:
 *           type: string
 *         district:
 *           type: string
 *         province:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *           nullable: true
 *         birthDay:
 *           type: integer
 *         birthMonth:
 *           type: integer
 *         birthYear:
 *           type: integer
 *           nullable: true
 *         loyaltyPoints:
 *           type: integer
 *         totalVisits:
 *           type: integer
 *         lastVisit:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CustomerRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - gender
 *         - location
 *         - district
 *         - province
 *         - phone
 *         - birthDay
 *         - birthMonth
 *       properties:
 *         fullName:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         location:
 *           type: string
 *           description: "Informal location like nyamirambo, karuruma"
 *         district:
 *           type: string
 *         province:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *           description: "Optional email address"
 *         birthDay:
 *           type: integer
 *           minimum: 1
 *           maximum: 31
 *         birthMonth:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         birthYear:
 *           type: integer
 *           description: "Optional birth year"
 *     CustomerStats:
 *       type: object
 *       properties:
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         stats:
 *           type: object
 *           properties:
 *             totalVisits:
 *               type: integer
 *             totalSpent:
 *               type: number
 *             loyaltyPoints:
 *               type: integer
 *             lastVisit:
 *               type: string
 *               format: date-time
 *             averageSpending:
 *               type: number
 *             isBirthdayMonth:
 *               type: boolean
 *             isEligibleForSixthVisitDiscount:
 *               type: boolean
 *             monthlyVisits:
 *               type: object
 */
/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with pagination
 *     tags: [Customers]
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
 *         description: Number of customers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, phone, or email
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
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
 *     summary: Register a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerRequest'
 *           example:
 *             fullName: "Marie Claire Uwimana"
 *             gender: "FEMALE"
 *             location: "Nyamirambo"
 *             district: "Nyarugenge"
 *             province: "Kigali City"
 *             phone: "+250788444444"
 *             email: "marie@example.com"
 *             birthDay: 15
 *             birthMonth: 3
 *             birthYear: 1990
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Validation error
 */
router.get('/', auth_1.authenticateToken, customerController_1.getAllCustomers);
router.post('/', auth_1.authenticateToken, customerController_1.createCustomer);
/**
 * @swagger
 * /api/customers/top:
 *   get:
 *     summary: Get top customers by visit count
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of top customers to return
 *     responses:
 *       200:
 *         description: Top customers retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       fullName:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       saleCount:
 *                         type: integer
 *                       totalSpent:
 *                         type: number
 *                       lastSale:
 *                         type: string
 *                         format: date-time
 *                       birthDay:
 *                         type: integer
 *                       birthMonth:
 *                         type: integer
 */
router.get('/top', auth_1.authenticateToken, customerController_1.getTopCustomers);
/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID with visit history
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *   put:
 *     summary: Update customer information (Admin/Manager only)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerRequest'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *       403:
 *         description: Forbidden - Admin/Manager access required
 */
router.get('/:id', auth_1.authenticateToken, customerController_1.getCustomerById);
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), customerController_1.updateCustomer);
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), customerController_1.deleteCustomer);
router.patch('/:id/toggle-active', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), customerController_1.toggleCustomerActive);
/**
 * @swagger
 * /api/customers/{id}/stats:
 *   get:
 *     summary: Get customer statistics and discount eligibility
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomerStats'
 *       404:
 *         description: Customer not found
 */
router.get('/:id/stats', auth_1.authenticateToken, customerController_1.getCustomerStats);
/**
 * @swagger
 * /api/customers/locations/provinces:
 *   get:
 *     summary: Get list of provinces for customer registration
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provinces retrieved successfully
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
 *                     type: string
 *                   example: ["Kigali City", "Eastern Province", "Western Province", "Northern Province", "Southern Province"]
 */
router.get('/locations/provinces', auth_1.authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: [
            "Kigali City",
            "Eastern Province",
            "Western Province",
            "Northern Province",
            "Southern Province"
        ]
    });
});
/**
 * @swagger
 * /api/customers/locations/districts/{province}:
 *   get:
 *     summary: Get districts by province
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: province
 *         required: true
 *         schema:
 *           type: string
 *         description: Province name
 *     responses:
 *       200:
 *         description: Districts retrieved successfully
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
 *                     type: string
 */
router.get('/locations/districts/:province', auth_1.authenticateToken, (req, res) => {
    const { province } = req.params;
    const districtsByProvince = {
        'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
        'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
        'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
        'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
        'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango']
    };
    const districts = districtsByProvince[province] || [];
    res.json({
        success: true,
        data: districts
    });
});
exports.default = router;
//# sourceMappingURL=customers.js.map