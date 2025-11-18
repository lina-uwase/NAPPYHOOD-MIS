import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, phone: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    console.log('🔐 Role check:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      requiredRoles: roles,
      path: req.path,
      method: req.method
    });

    if (!req.user) {
      console.log('❌ No user in request');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Insufficient permissions:', { userRole: req.user.role, requiredRoles: roles });
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    console.log('✅ Role check passed');
    next();
  };
};

export { AuthenticatedRequest };