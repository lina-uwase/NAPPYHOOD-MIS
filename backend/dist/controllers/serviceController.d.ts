import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getAllServices: (req: Request, res: Response) => Promise<void>;
export declare const getServiceById: (req: Request, res: Response) => Promise<void>;
export declare const createService: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateService: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteService: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=serviceController.d.ts.map