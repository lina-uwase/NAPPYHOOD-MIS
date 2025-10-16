declare class EmailService {
    private transporter;
    constructor();
    sendWelcomeEmail(email: string, name: string, password: string, phone?: string): Promise<boolean>;
    sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean>;
    testConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=emailService.d.ts.map