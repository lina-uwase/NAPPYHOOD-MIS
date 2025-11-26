"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = exports.updateProfilePicture = exports.changePassword = exports.updateProfile = exports.getProfile = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../utils/database");
const passwordGenerator_1 = require("../utils/passwordGenerator");
const smsService_1 = require("../services/smsService");
const emailService_1 = require("../services/emailService");
const login = async (req, res) => {
    try {
        const { phone, email, password } = req.body;
        console.log('🔐 Login attempt:', { phone, email: email ? 'provided' : 'not provided' });
        const identifier = phone || email;
        if (!identifier || !password) {
            res.status(400).json({ error: 'Email/phone number and password are required' });
            return;
        }
        // Find user by phone or email
        let user;
        if (identifier.includes('@')) {
            // It's an email
            user = await database_1.prisma.user.findUnique({
                where: { email: identifier },
                select: {
                    id: true,
                    phone: true,
                    email: true,
                    password: true,
                    name: true,
                    role: true,
                    isActive: true
                }
            });
        }
        else {
            // It's a phone number
            user = await database_1.prisma.user.findUnique({
                where: { phone: identifier },
                select: {
                    id: true,
                    phone: true,
                    email: true,
                    password: true,
                    name: true,
                    role: true,
                    isActive: true
                }
            });
        }
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Activate user on first successful login
        if (!user.isActive) {
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { isActive: true }
            });
            console.log(`✅ User ${user.name} activated on first login`);
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, phone: user.phone, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        console.error('❌ Login error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            error
        });
        res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        console.log('📝 Registration request body:', JSON.stringify(req.body, null, 2));
        const { name, email, phone, role = 'STAFF' } = req.body;
        if (!name || !phone) {
            console.log('❌ Missing required fields - name:', !!name, 'phone:', !!phone, 'email:', !!email);
            res.status(400).json({ error: 'Name and phone number are required' });
            return;
        }
        // Validate phone number format if provided
        if (phone && !(0, passwordGenerator_1.isValidPhoneNumber)(phone)) {
            res.status(400).json({ error: 'Invalid phone number format. Use +250XXXXXXXXX' });
            return;
        }
        // Validate email format if provided
        if (email && !email.includes('@')) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }
        // Check if ACTIVE user already exists by phone or email
        const existingUser = await database_1.prisma.user.findFirst({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [
                            phone ? { phone } : {},
                            email ? { email } : {}
                        ].filter(condition => Object.keys(condition).length > 0)
                    }
                ]
            }
        });
        if (existingUser) {
            const conflictField = existingUser.phone === phone ? 'phone number' : 'email';
            res.status(400).json({ error: `User with this ${conflictField} already exists` });
            return;
        }
        // Generate random password
        const randomPassword = (0, passwordGenerator_1.generateRandomPassword)(8);
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(randomPassword, 10);
        // Create user (inactive until first login)
        const user = await database_1.prisma.user.create({
            data: {
                name,
                email: email || null, // Email is optional
                password: hashedPassword,
                phone,
                role: role,
                isActive: false // New staff are inactive until they log in for the first time
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true
            }
        });
        // Send welcome email with credentials (only if email is provided)
        let notificationResult = false;
        let notificationMethod = '';
        if (email) {
            // Send email notification (primary method if email provided)
            notificationResult = await emailService_1.emailService.sendWelcomeEmail(email, name, randomPassword, phone);
            notificationMethod = 'email';
            if (!notificationResult) {
                console.warn(`Failed to send welcome email to ${email} for user ${name}`);
                // Fallback to SMS if email fails
                if (phone) {
                    notificationResult = await smsService_1.smsService.sendWelcomeMessage(phone, name, randomPassword);
                    notificationMethod = notificationResult ? 'SMS' : '';
                    if (!notificationResult) {
                        console.warn(`Failed to send SMS backup to ${phone} for user ${name}`);
                    }
                }
            }
        }
        else {
            // If no email, try SMS only
            if (phone) {
                notificationResult = await smsService_1.smsService.sendWelcomeMessage(phone, name, randomPassword);
                notificationMethod = notificationResult ? 'SMS' : '';
                if (!notificationResult) {
                    console.warn(`Failed to send SMS to ${phone} for user ${name}`);
                }
            }
        }
        res.status(201).json({
            success: true,
            data: { user },
            message: `User registered successfully. ${notificationResult ? `Login credentials sent via ${notificationMethod}.` : 'Please contact admin for login credentials.'}`
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const getProfile = async (req, res) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                // profilePicture: true,
                createdAt: true
            }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            success: true,
            data: {
                user_id: user.id,
                names: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                // profile_picture: user.profilePicture,
                created_at: user.createdAt
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const { names, phone } = req.body;
        if (!names || !phone) {
            res.status(400).json({ error: 'Names and phone are required' });
            return;
        }
        const user = await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                name: names,
                phone: phone
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                // profilePicture: true
            }
        });
        res.json({
            success: true,
            data: {
                user_id: user.id,
                names: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                // profile_picture: user.profilePicture
            },
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            res.status(400).json({ error: 'Current password and new password are required' });
            return;
        }
        // Get current user with password
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { password: true }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Verify current password
        const isValidPassword = await bcryptjs_1.default.compare(current_password, user.password);
        if (!isValidPassword) {
            res.status(400).json({ error: 'Invalid current password' });
            return;
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(new_password, 10);
        // Update password
        await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.changePassword = changePassword;
const updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        // Check if file was uploaded
        if (!req.file) {
            res.status(400).json({ error: 'No profile picture file provided' });
            return;
        }
        // Create the URL path for the uploaded file
        const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
        const updatedUser = await database_1.prisma.user.update({
            where: { id: userId },
            data: { profilePicture: profilePictureUrl },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                profilePicture: true
            }
        });
        res.json({
            success: true,
            data: {
                user_id: updatedUser.id,
                names: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                profile_picture: updatedUser.profilePicture
            },
            message: 'Profile picture updated successfully'
        });
    }
    catch (error) {
        console.error('Update profile picture error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProfilePicture = updateProfilePicture;
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const whereClause = {
            isActive: true
        };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role) {
            whereClause.role = role;
        }
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true
                },
                skip: offset,
                take: Number(limit),
                orderBy: { name: 'asc' }
            }),
            database_1.prisma.user.count({ where: whereClause })
        ]);
        const formattedUsers = users.map((user) => ({
            user_id: user.id,
            names: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            created_at: user.createdAt,
            updated_at: user.createdAt
        }));
        res.json({
            success: true,
            data: formattedUsers,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            success: true,
            data: {
                user_id: user.id,
                names: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                created_at: user.createdAt,
                updated_at: user.createdAt
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { names, phone, role } = req.body;
        const updateData = {};
        if (names)
            updateData.name = names;
        if (phone)
            updateData.phone = phone;
        if (role)
            updateData.role = role;
        const user = await database_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true
            }
        });
        res.json({
            success: true,
            data: {
                user_id: user.id,
                names: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                created_at: user.createdAt,
                updated_at: user.createdAt
            },
            message: 'User updated successfully'
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await database_1.prisma.user.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=authController.js.map