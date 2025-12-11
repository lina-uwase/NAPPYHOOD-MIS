"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all products (all authenticated users can view)
router.get('/', auth_1.authenticateToken, productController_1.getAllProducts);
// Get single product
router.get('/:id', auth_1.authenticateToken, productController_1.getProduct);
// Create product (Admin and Manager only)
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), productController_1.createProduct);
// Update product (Admin and Manager only)
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), productController_1.updateProduct);
// Increase stock (Admin and Manager only)
router.post('/:id/increase-stock', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), productController_1.increaseStock);
// Delete product (Admin and Manager only)
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), productController_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=products.js.map