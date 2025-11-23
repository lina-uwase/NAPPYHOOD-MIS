"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../utils/database");
const authenticateToken = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('✅ Auth middleware - token decoded successfully:', { userId: decoded.userId, role: decoded.role });
        // Verify user exists and is active
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, phone: true, role: true, isActive: true }
        });
        if (!user || !user.isActive) {
            console.log('❌ Auth middleware - user not found or inactive:', { userId: decoded.userId, userExists: !!user, isActive: user?.isActive });
            res.status(401).json({ error: 'Invalid or inactive user' });
            return;
        }
        console.log('✅ Auth middleware - user authenticated successfully:', { userId: user.id, role: user.role });
        req.user = user;
        next();
    }
    catch (error) {
        console.log('❌ Auth middleware - token verification failed:', error);
        res.status(403).json({ error: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map