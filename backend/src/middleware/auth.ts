import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: string;
    canDeleteSales?: boolean;
  };
  file?: Express.Multer.File;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 Auth middleware - incoming request:', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!req.headers['authorization']
    });

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ Auth middleware - no token provided');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('✅ Auth middleware - token decoded successfully:', { userId: decoded.userId, role: decoded.role });

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, phone: true, role: true, isActive: true, canDeleteSales: true }
    });

    if (!user || !user.isActive) {
      console.log('❌ Auth middleware - user not found or inactive:', { userId: decoded.userId, userExists: !!user, isActive: user?.isActive });
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }

    console.log('✅ Auth middleware - user authenticated successfully:', { userId: user.id, role: user.role });
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ Auth middleware - token verification failed:', error);
    // Check if token is expired
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    // For other JWT errors (invalid token, malformed, etc.), return 401
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }
    // For any other errors, return 401 as well
    res.status(401).json({ error: 'Authentication failed' });
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