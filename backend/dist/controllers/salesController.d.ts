import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const createSale: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllSales: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSaleById: (req: Request, res: Response) => Promise<void>;
export declare const updateSale: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteSale: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const completeSale: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSalesSummary: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSalesByCustomer: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=salesController.d.ts.map