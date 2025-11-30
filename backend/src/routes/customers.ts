import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerStats,
  getTopCustomers,
  deleteCustomer,
  toggleCustomerActive,
  getDiscountEligibility
} from '../controllers/customerController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

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
router.get('/', authenticateToken, getAllCustomers);
router.post('/', authenticateToken, createCustomer);

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
router.get('/top', authenticateToken, getTopCustomers);

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
router.get('/:id', authenticateToken, getCustomerById);
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), updateCustomer);
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), deleteCustomer);
router.patch('/:id/toggle-active', authenticateToken, requireRole(['ADMIN', 'MANAGER']), toggleCustomerActive);

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
router.get('/:id/stats', authenticateToken, getCustomerStats);

/**
 * @swagger
 * /api/customers/{id}/discount-eligibility:
 *   get:
 *     summary: Get customer discount eligibility for next sale
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
 *         description: Discount eligibility retrieved successfully
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
 *                     sixthVisitEligible:
 *                       type: boolean
 *                     isBirthdayMonth:
 *                       type: boolean
 *                     birthdayDiscountAvailable:
 *                       type: boolean
 *                     birthdayDiscountUsed:
 *                       type: boolean
 *                     nextSaleCount:
 *                       type: integer
 *       404:
 *         description: Customer not found
 */
router.get('/:id/discount-eligibility', authenticateToken, getDiscountEligibility);

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
router.get('/locations/provinces', authenticateToken, (req, res) => {
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
router.get('/locations/districts/:province', authenticateToken, (req, res) => {
  const { province } = req.params;

  const districtsByProvince: Record<string, string[]> = {
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

/**
 * @swagger
 * /api/customers/locations/sectors/{province}/{district}:
 *   get:
 *     summary: Get sectors by province and district
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
 *       - in: path
 *         name: district
 *         required: true
 *         schema:
 *           type: string
 *         description: District name
 *     responses:
 *       200:
 *         description: Sectors retrieved successfully
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
router.get('/locations/sectors/:province/:district', authenticateToken, (req, res) => {
  const { district } = req.params;

  const sectorsByDistrict: Record<string, string[]> = {
    // Kigali City
    'Gasabo': ['Bumbogo', 'Gatsata', 'Jali', 'Gikomero', 'Gisozi', 'Jabana', 'Kacyiru', 'Kimihurura', 'Kimironko', 'Kinyinya', 'Ndera', 'Nduba', 'Rusororo', 'Rutunga'],
    'Kicukiro': ['Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Niboye', 'Nyarugunga', 'Rukiri', 'Masaka'],
    'Nyarugenge': ['Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo'],

    // Eastern Province
    'Bugesera': ['Gashora', 'Juru', 'Kamabuye', 'Mareba', 'Mayange', 'Musenyi', 'Mwogo', 'Ngeruka', 'Ntarama', 'Nyamata', 'Nyarugenge', 'Rilima', 'Ruhuha', 'Rweru', 'Shyara'],
    'Gatsibo': ['Gasange', 'Gatsibo', 'Gitoki', 'Kabarore', 'Kageyo', 'Kiramuruzi', 'Kiziguro', 'Muhura', 'Murambi', 'Nyagihanga', 'Remera', 'Rugarama', 'Rwimbogo'],
    'Kayonza': ['Gahini', 'Kabare', 'Kabarondo', 'Mukarange', 'Murama', 'Murundi', 'Mwiri', 'Ndego', 'Nyamirama', 'Rukara', 'Ruramira', 'Rwinkwavu'],
    'Kirehe': ['Gahara', 'Gatore', 'Kigarama', 'Kigina', 'Kirehe', 'Mahama', 'Mpanga', 'Musaza', 'Mushikiri', 'Nasho', 'Nyamugari', 'Nyarubuye', 'Rwabukwisi', 'Rwanyamuhanga'],
    'Ngoma': ['Gashanda', 'Jarama', 'Karembo', 'Kazo', 'Kibungo', 'Mugesera', 'Murama', 'Mutenderi', 'Remera', 'Rukira', 'Rukumberi', 'Rurenge', 'Sake', 'Zaza'],
    'Nyagatare': ['Bukure', 'Bwiyorere', 'Gatunda', 'Kanyangese', 'Karangazi', 'Katabagemu', 'Kiyombe', 'Matimba', 'Mimuli', 'Mukama', 'Musheri', 'Nyagatare', 'Rukomo', 'Rwempasha', 'Rwimiyaga', 'Tabagwe'],
    'Rwamagana': ['Fumbwe', 'Gahengeri', 'Gishali', 'Karenge', 'Kigabiro', 'Muhazi', 'Munyaga', 'Munyiginya', 'Musha', 'Muyumbu', 'Mwulire', 'Nyakaliro', 'Nzige', 'Rubona', 'Rusiga'],

    // Northern Province
    'Burera': ['Bungwe', 'Butaro', 'Cyanika', 'Cyeru', 'Gahunga', 'Gatebe', 'Gitovu', 'Kagogo', 'Kinoni', 'Kinyababa', 'Kivuye', 'Nemba', 'Rugarama', 'Rugengabari', 'Ruhunde', 'Rusarabuye', 'Rwerere'],
    'Gakenke': ['Busengo', 'Coko', 'Cyabingo', 'Gakenke', 'Gashenyi', 'Janja', 'Kamubuga', 'Karambo', 'Kivuruga', 'Mataba', 'Minazi', 'Mugunga', 'Muhondo', 'Muhororo', 'Musanze', 'Nemba', 'Ruli', 'Rusasa', 'Rushashi'],
    'Gicumbi': ['Bukure', 'Bwisige', 'Byumba', 'Cyumba', 'Gicumbi', 'Kaniga', 'Manyagiro', 'Miyove', 'Munini', 'Nyamiyaga', 'Nyankenke', 'Rubaya', 'Rukomo', 'Rushenyi', 'Rutare', 'Rwerere'],
    'Musanze': ['Busogo', 'Cyuve', 'Gacaca', 'Gashaki', 'Gataraga', 'Kimonyi', 'Kinigi', 'Muhoza', 'Muko', 'Musanze', 'Nkotsi', 'Nyange', 'Remera', 'Rwaza', 'Shingiro'],
    'Rulindo': ['Base', 'Burega', 'Bushoki', 'Buyoga', 'Cyinzuzi', 'Cyungo', 'Kinihira', 'Kinyami', 'Nemba', 'Rulindo', 'Rusagara', 'Rushashi', 'Rutare', 'Rwamiko', 'Shangasha'],

    // Southern Province
    'Gisagara': ['Gikonko', 'Gishubi', 'Kansi', 'Kibilizi', 'Kigembe', 'Mamba', 'Muganza', 'Mugombwa', 'Mukindo', 'Musha', 'Ndora', 'Nyanza', 'Nyanza', 'Nyeza', 'Save'],
    'Huye': ['Gishamvu', 'Karama', 'Kigoma', 'Kinazi', 'Maraba', 'Mbazi', 'Mukura', 'Ngoma', 'Ruhashya', 'Rusatira', 'Rwaniro', 'Simbi', 'Tumba'],
    'Kamonyi': ['Gacurabwenge', 'Karama', 'Kayenzi', 'Kigali', 'Mugina', 'Musambira', 'Ngamba', 'Nyamiyaga', 'Nyarubaka', 'Rugarika', 'Rukoma', 'Runda'],
    'Muhanga': ['Cyeza', 'Kabacuzi', 'Kibangu', 'Kiyumba', 'Muhanga', 'Mushishiro', 'Nyabinoni', 'Nyamabuye', 'Nyarusange', 'Rongi', 'Rugendabari', 'Shyogwe'],
    'Nyamagabe': ['Buruhukiro', 'Cyanika', 'Gasaka', 'Gatare', 'Kaduha', 'Kamegeri', 'Kibirizi', 'Kibumbwe', 'Kitabi', 'Mbazi', 'Mugano', 'Musange', 'Musebeya', 'Mushubi', 'Nkomane', 'Nsanga', 'Tare'],
    'Nyanza': ['Busasamana', 'Busoro', 'Cyabakamyi', 'Kibilizi', 'Kigoma', 'Mukingo', 'Muyira', 'Ntyazo', 'Nyagisozi', 'Rwabicuma', 'Rwamiko'],
    'Nyaruguru': ['Busanze', 'Cyahinda', 'Kibeho', 'Kivu', 'Mata', 'Muganza', 'Munini', 'Ngera', 'Ngoma', 'Nyabimata', 'Nyagisozi', 'Nyakagezi', 'Rasano', 'Rusenge', 'Rwamiko'],
    'Ruhango': ['Bweramana', 'Byimana', 'Kabagali', 'Kinazi', 'Kinihira', 'Mbuye', 'Mukingo', 'Muyira', 'Nkungu', 'Ruhango', 'Rusatira', 'Rwabukamba', 'Rwamiko', 'Rwinkuba'],

    // Western Province
    'Karongi': ['Bwishyura', 'Gashari', 'Gishyita', 'Gitesi', 'Mubuga', 'Murambi', 'Murundi', 'Mutuntu', 'Rubengera', 'Rugabano', 'Ruganda', 'Rwankuba', 'Twumba'],
    'Ngororero': ['Bwira', 'Gatumba', 'Hindiro', 'Kabaya', 'Kageyo', 'Kavumu', 'Matyazo', 'Muhanda', 'Muhororo', 'Ndaro', 'Ngororero', 'Ngoma', 'Nyabiteke', 'Nyange', 'Rubavu', 'Rurembo', 'Shyira'],
    'Nyabihu': ['Bigogwe', 'Jenda', 'Jomba', 'Kabatwa', 'Karago', 'Kintobo', 'Mukamira', 'Muringa', 'Rambura', 'Rugera', 'Rurembo', 'Rwankuba', 'Shyira'],
    'Nyamasheke': ['Bushekeri', 'Bushoki', 'Cyanzarwe', 'Gihombo', 'Kagano', 'Kanjongo', 'Karengera', 'Karongi', 'Kibogora', 'Kibuye', 'Kitabi', 'Macuba', 'Mahembe', 'Mukingo', 'Nyabiteke', 'Rugabano', 'Ruganda', 'Rwamiko', 'Rwinkuba'],
    'Rubavu': ['Bugeshi', 'Busasamana', 'Cyanzarwe', 'Gisenyi', 'Kanama', 'Mudende', 'Nyakiliba', 'Nyamyumba', 'Rubavu', 'Rugerero'],
    'Rusizi': ['Bugarama', 'Butare', 'Gihombo', 'Giheke', 'Gishoma', 'Kamembe', 'Muganza', 'Mururu', 'Nkanka', 'Nkombo', 'Nyakabuye', 'Nyakarenzo', 'Rwimbogo'],
    'Rutsiro': ['Boneza', 'Gihango', 'Kigeyo', 'Kivumu', 'Manihira', 'Mukura', 'Murunda', 'Musasa', 'Mushonyi', 'Mushubati', 'Nyabirasi', 'Ruhango', 'Rusebeya', 'Rwankuba']
  };

  const sectors = sectorsByDistrict[district] || [];

  res.json({
    success: true,
    data: sectors
  });
});

export default router;