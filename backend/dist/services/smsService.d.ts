declare class SMSService {
    private config;
    private africasTalking;
    constructor();
    sendSMS(phoneNumber: string, message: string): Promise<boolean>;
    sendWelcomeMessage(phoneNumber: string, name: string, password: string): Promise<boolean>;
    sendPasswordReset(phoneNumber: string, newPassword: string): Promise<boolean>;
}
export declare const smsService: SMSService;
export default smsService;
//# sourceMappingURL=smsService.d.ts.map