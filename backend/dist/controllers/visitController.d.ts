import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const createVisit: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllVisits: (req: Request, res: Response) => Promise<void>;
export declare const getVisitById: (req: Request, res: Response) => Promise<void>;
export declare const updateVisit: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteVisit: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const completeVisit: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getVisitsSummary: (req: Request, res: Response) => Promise<void>;
export declare const getVisitsByCustomer: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=visitController.d.ts.map