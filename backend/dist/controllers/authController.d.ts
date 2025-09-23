import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const getProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const changePassword: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateProfilePicture: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
export declare const getUserById: (req: Request, res: Response) => Promise<void>;
export declare const updateUser: (req: Request, res: Response) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map