import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

// Get all products
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query;

    const whereClause: any = {};
    if (isActive !== undefined) {
      whereClause.isActive = String(isActive) === 'true';
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    // Calculate total revenue for each product
    const productRevenue = await prisma.saleProduct.groupBy({
      by: ['productId'],
      _sum: {
        totalPrice: true
      }
    });

    const revenueMap = new Map();
    productRevenue.forEach(p => {
      revenueMap.set(p.productId, Number(p._sum.totalPrice || 0));
    });

    const productsWithRevenue = products.map(p => ({
      ...p,
      totalRevenue: revenueMap.get(p.id) || 0
    }));

    res.json({
      success: true,
      data: productsWithRevenue
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single product
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create product
export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, quantity } = req.body;

    if (!name || price === undefined) {
      res.status(400).json({ error: 'Name and price are required' });
      return;
    }

    // Check if product with same name already exists
    const existingProduct = await prisma.product.findUnique({
      where: { name }
    });

    if (existingProduct) {
      res.status(400).json({ error: 'Product with this name already exists' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        quantity: quantity ? Number(quantity) : 0,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update product
export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, description, price, quantity, isActive } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existingProduct.name) {
      const nameExists = await prisma.product.findUnique({ where: { name } });
      if (nameExists) {
        res.status(400).json({ error: 'Product with this name already exists' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (price !== undefined) updateData.price = Number(price);
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Increase stock quantity
export const increaseStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { quantity } = req.body;

    if (quantity === undefined || Number(quantity) <= 0) {
      res.status(400).json({ error: 'Valid quantity is required' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        quantity: { increment: Number(quantity) }
      }
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: `Stock increased by ${quantity}. New quantity: ${updatedProduct.quantity}`
    });
  } catch (error) {
    console.error('Increase stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete product
export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        saleProducts: true
      }
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check if product has been sold (has sale records)
    if (existingProduct.saleProducts.length > 0) {
      // Don't delete, just deactivate
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({
        success: true,
        data: updatedProduct,
        message: 'Product has sales records. Product has been deactivated instead of deleted.'
      });
      return;
    }

    // Safe to delete if no sales
    await prisma.product.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
