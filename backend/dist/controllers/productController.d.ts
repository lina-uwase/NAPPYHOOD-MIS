import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getAllProducts: (req: Request, res: Response) => Promise<void>;
export declare const getProduct: (req: Request, res: Response) => Promise<void>;
export declare const createProduct: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateProduct: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const increaseStock: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteProduct: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=productController.d.ts.map