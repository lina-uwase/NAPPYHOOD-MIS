import { Router } from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  increaseStock,
  deleteProduct
} from '../controllers/productController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get all products (all authenticated users can view)
router.get('/', authenticateToken, getAllProducts);

// Get single product
router.get('/:id', authenticateToken, getProduct);

// Create product (Admin and Manager only)
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), createProduct);

// Update product (Admin and Manager only)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), updateProduct);

// Increase stock (Admin and Manager only)
router.post('/:id/increase-stock', authenticateToken, requireRole(['ADMIN', 'MANAGER']), increaseStock);

// Delete product (Admin and Manager only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), deleteProduct);

export default router;
