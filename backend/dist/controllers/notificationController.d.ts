import { Request, Response } from 'express';
export declare const getNotifications: (req: Request | any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createNotification: (req: Request | any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markAsRead: (req: Request, res: Response) => Promise<void>;
export declare const markAllAsRead: (req: Request | any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const clearHistory: (req: Request | any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=notificationController.d.ts.map