import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isActive = 'true' } = req.query;

    const whereClause: any = {
      isActive: isActive === 'true'
    };

    if (category) {
      whereClause.category = category;
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

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
      childCombinedPrice,
      duration,
      isComboEligible = false
    } = req.body;

    if (!name || !category || !description || !singlePrice || !duration) {
      res.status(400).json({ error: 'Name, category, description, singlePrice, and duration are required' });
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
        description,
        singlePrice: parseFloat(singlePrice),
        combinedPrice: combinedPrice ? parseFloat(combinedPrice) : null,
        childPrice: childPrice ? parseFloat(childPrice) : null,
        childCombinedPrice: childCombinedPrice ? parseFloat(childCombinedPrice) : null,
        duration: parseInt(duration),
        isComboEligible
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
    const { id } = req.params;
    const {
      name,
      category,
      description,
      singlePrice,
      combinedPrice,
      childPrice,
      childCombinedPrice,
      duration,
      isComboEligible,
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
    if (description !== undefined) updateData.description = description;
    if (singlePrice !== undefined) updateData.singlePrice = parseFloat(singlePrice);
    if (combinedPrice !== undefined) updateData.combinedPrice = combinedPrice ? parseFloat(combinedPrice) : null;
    if (childPrice !== undefined) updateData.childPrice = childPrice ? parseFloat(childPrice) : null;
    if (childCombinedPrice !== undefined) updateData.childCombinedPrice = childCombinedPrice ? parseFloat(childCombinedPrice) : null;
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (isComboEligible !== undefined) updateData.isComboEligible = isComboEligible;
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
    const { id } = req.params;

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