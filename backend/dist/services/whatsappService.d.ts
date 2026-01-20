export declare const sendWhatsAppMessage: (to: string, message: string) => Promise<boolean>;
export declare const sendTransactionAlert: (customerName: string, phoneNumber: string, amount: number, totalSpent: number, visitCount: number) => Promise<boolean>;
export declare const sendBirthdayDiscount: (customerName: string, phoneNumber: string, discount: string) => Promise<boolean>;
//# sourceMappingURL=whatsappService.d.ts.map