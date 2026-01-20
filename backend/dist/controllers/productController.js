"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.increaseStock = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getAllProducts = void 0;
const database_1 = require("../utils/database");
// Get all products
const getAllProducts = async (req, res) => {
    try {
        const { isActive } = req.query;
        const whereClause = {};
        if (isActive !== undefined) {
            whereClause.isActive = String(isActive) === 'true';
        }
        const products = await database_1.prisma.product.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });
        // Calculate total revenue for each product
        const productRevenue = await database_1.prisma.saleProduct.groupBy({
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
    }
    catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllProducts = getAllProducts;
// Get single product
const getProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json({
            success: true,
            data: product
        });
    }
    catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProduct = getProduct;
// Create product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, quantity } = req.body;
        if (!name || price === undefined) {
            res.status(400).json({ error: 'Name and price are required' });
            return;
        }
        // Check if product with same name already exists
        const existingProduct = await database_1.prisma.product.findUnique({
            where: { name }
        });
        if (existingProduct) {
            res.status(400).json({ error: 'Product with this name already exists' });
            return;
        }
        const product = await database_1.prisma.product.create({
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
    }
    catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createProduct = createProduct;
// Update product
const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, price, quantity, isActive } = req.body;
        const existingProduct = await database_1.prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        // Check if name is being changed and if new name already exists
        if (name && name !== existingProduct.name) {
            const nameExists = await database_1.prisma.product.findUnique({ where: { name } });
            if (nameExists) {
                res.status(400).json({ error: 'Product with this name already exists' });
                return;
            }
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name.trim();
        if (description !== undefined)
            updateData.description = description?.trim() || null;
        if (price !== undefined)
            updateData.price = Number(price);
        if (quantity !== undefined)
            updateData.quantity = Number(quantity);
        if (isActive !== undefined)
            updateData.isActive = Boolean(isActive);
        const product = await database_1.prisma.product.update({
            where: { id },
            data: updateData
        });
        res.json({
            success: true,
            data: product,
            message: 'Product updated successfully'
        });
    }
    catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProduct = updateProduct;
// Increase stock quantity
const increaseStock = async (req, res) => {
    try {
        const id = req.params.id;
        const { quantity } = req.body;
        if (quantity === undefined || Number(quantity) <= 0) {
            res.status(400).json({ error: 'Valid quantity is required' });
            return;
        }
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        const updatedProduct = await database_1.prisma.product.update({
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
    }
    catch (error) {
        console.error('Increase stock error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.increaseStock = increaseStock;
// Delete product
const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const existingProduct = await database_1.prisma.product.findUnique({
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
            const updatedProduct = await database_1.prisma.product.update({
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
        await database_1.prisma.product.delete({ where: { id } });
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=productController.js.map