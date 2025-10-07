import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
/**
 * Get current user's profile
 */
export declare const getMyProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Update current user's profile (name, phone, email)
 */
export declare const updateMyProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Change current user's password
 */
export declare const changeMyPassword: (req: Request, res: Response) => Promise<void>;
/**
 * Upload/update profile picture
 */
export declare const updateProfilePicture: (req: Request, res: Response) => Promise<void>;
/**
 * Delete profile picture
 */
export declare const deleteProfilePicture: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=userProfileController.d.ts.map