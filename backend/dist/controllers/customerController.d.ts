import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getAllCustomers: (req: Request, res: Response) => Promise<void>;
export declare const getCustomerById: (req: Request, res: Response) => Promise<void>;
export declare const createCustomer: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateCustomer: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteCustomer: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const toggleCustomerActive: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCustomerStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=customerController.d.ts.map