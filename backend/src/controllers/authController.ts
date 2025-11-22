import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateRandomPassword, isValidPhoneNumber } from '../utils/passwordGenerator';
import { smsService } from '../services/smsService';
import { emailService } from '../services/emailService';

export const login = async (req: Request, res: Response): Promise<void> => {
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
      user = await prisma.user.findUnique({
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
    } else {
      // It's a phone number
      user = await prisma.user.findUnique({
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
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Activate user on first successful login
    if (!user.isActive) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true }
      });
      console.log(`✅ User ${user.name} activated on first login`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error('❌ Login error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error
    });
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Registration request body:', JSON.stringify(req.body, null, 2));
    const { name, email, phone, role = 'STAFF' } = req.body;

    if (!name || !email || !phone) {
      console.log('❌ Missing required fields - name:', !!name, 'phone:', !!phone, 'email:', !!email);
      res.status(400).json({ error: 'Name, email, and phone number are all required' });
      return;
    }

    // Validate phone number format if provided
    if (phone && !isValidPhoneNumber(phone)) {
      res.status(400).json({ error: 'Invalid phone number format. Use +250XXXXXXXXX' });
      return;
    }

    // Validate email format
    if (!email.includes('@')) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Check if ACTIVE user already exists by phone or email
    const existingUser = await prisma.user.findFirst({
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
    const randomPassword = generateRandomPassword(8);

    // Hash password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create user (inactive until first login)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: role as any,
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

    // Send welcome email with credentials (email is now required)
    let notificationResult = false;
    let notificationMethod = '';

    // Send email notification (primary method)
    notificationResult = await emailService.sendWelcomeEmail(email, name, randomPassword, phone);
    notificationMethod = 'email';

    if (!notificationResult) {
      console.warn(`Failed to send welcome email to ${email} for user ${name}`);

      // Fallback to SMS if email fails
      if (phone) {
        notificationResult = await smsService.sendWelcomeMessage(phone, name, randomPassword);
        notificationMethod = notificationResult ? 'SMS' : '';

        if (!notificationResult) {
          console.warn(`Failed to send SMS backup to ${phone} for user ${name}`);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: { user },
      message: `User registered successfully. ${notificationResult ? `Login credentials sent via ${notificationMethod}.` : 'Please contact admin for login credentials.'}`
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { names, phone } = req.body;

    if (!names || !phone) {
      res.status(400).json({ error: 'Names and phone are required' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
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
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { password: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    if (!isValidPassword) {
      res.status(400).json({ error: 'Invalid current password' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfilePicture = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ error: 'No profile picture file provided' });
      return;
    }

    // Create the URL path for the uploaded file
    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
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
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = '', role } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      isActive: true
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where: whereClause })
    ]);

    const formattedUsers = users.map(user => ({
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
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { names, phone, role } = req.body;

    const updateData: any = {};
    if (names) updateData.name = names;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;

    const user = await prisma.user.update({
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
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};