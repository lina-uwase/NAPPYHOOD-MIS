import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getAllStaff: (req: Request, res: Response) => Promise<void>;
export declare const getStaffById: (req: Request, res: Response) => Promise<void>;
export declare const getStaffPerformance: (req: Request, res: Response) => Promise<void>;
export declare const getAllStaffPerformance: (req: Request, res: Response) => Promise<void>;
export declare const updateStaff: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=staffController.d.ts.map