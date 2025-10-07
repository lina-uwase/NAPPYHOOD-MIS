import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Get current user's profile
 */
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

/**
 * Update current user's profile (name, phone, email)
 */
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { name, phone, email } = req.body;

    // Validate required fields
    if (!name || !phone || !email) {
      res.status(400).json({
        success: false,
        message: 'Name, phone, and email are required'
      });
      return;
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email is already taken by another user'
      });
      return;
    }

    // Check if phone is already taken by another user
    const existingPhoneUser = await prisma.user.findFirst({
      where: {
        phone,
        id: { not: userId }
      }
    });

    if (existingPhoneUser) {
      res.status(400).json({
        success: false,
        message: 'Phone number is already taken by another user'
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Change current user's password
 */
export const changeMyPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirmation are required'
      });
      return;
    }

    // Validate new password confirmation
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
      return;
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
      return;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidCurrentPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

/**
 * Upload/update profile picture
 */
export const updateProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: profilePictureUrl },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture'
    });
  }
};

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile picture deleted successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture'
    });
  }
};