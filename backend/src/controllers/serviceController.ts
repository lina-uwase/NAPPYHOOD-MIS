import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, category, isActive = 'true' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      isActive: isActive === 'true'
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.service.count({ where: whereClause })
    ]);

    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: services,
      meta: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      category,
      description,
      singlePrice,
      combinedPrice,
      childPrice,
      childCombinedPrice
    } = req.body;

    if (!name || !category || !singlePrice) {
      res.status(400).json({ error: 'Name, category, and singlePrice are required' });
      return;
    }

    // Check if service already exists
    const existingService = await prisma.service.findUnique({
      where: { name }
    });

    if (existingService) {
      res.status(400).json({ error: 'Service with this name already exists' });
      return;
    }

    const service = await prisma.service.create({
      data: {
        name,
        category,
        description: description || null,
        singlePrice: parseFloat(singlePrice),
        combinedPrice: combinedPrice ? parseFloat(combinedPrice) : null,
        childPrice: childPrice ? parseFloat(childPrice) : null,
        childCombinedPrice: childCombinedPrice ? parseFloat(childCombinedPrice) : null
      }
    });

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      name,
      category,
      description,
      singlePrice,
      combinedPrice,
      childPrice,
      childCombinedPrice,
      isActive
    } = req.body;

    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existingService.name) {
      const nameExists = await prisma.service.findUnique({
        where: { name }
      });
      if (nameExists) {
        res.status(400).json({ error: 'Service with this name already exists' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description || null;
    if (singlePrice !== undefined) updateData.singlePrice = parseFloat(singlePrice);
    if (combinedPrice !== undefined) updateData.combinedPrice = combinedPrice ? parseFloat(combinedPrice) : null;
    if (childPrice !== undefined) updateData.childPrice = childPrice ? parseFloat(childPrice) : null;
    if (childCombinedPrice !== undefined) updateData.childCombinedPrice = childCombinedPrice ? parseFloat(childCombinedPrice) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const service = await prisma.service.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    // Soft delete by setting isActive to false
    await prisma.service.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};