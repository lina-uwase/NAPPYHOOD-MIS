// @ts-ignore - AfricasTalking doesn't have TypeScript definitions
const AfricasTalking = require('africastalking');

interface SMSConfig {
  apiKey: string;
  username: string;
  from: string;
}

class SMSService {
  private config: SMSConfig;
  private africasTalking: any;

  constructor() {
    this.config = {
      apiKey: process.env.SMS_API_KEY || '',
      username: process.env.SMS_USERNAME || 'sandbox', // Use 'sandbox' for testing
      from: process.env.SMS_SENDER_ID || 'NAPPYHOOD'
    };

    // Only initialize Africa's Talking if we have API credentials
    if (this.config.apiKey && this.config.username) {
      this.africasTalking = AfricasTalking({
        apiKey: this.config.apiKey,
        username: this.config.username
      });
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // If no API key or in development mode, just log the SMS
      if (!this.config.apiKey || process.env.NODE_ENV === 'development' || process.env.SMS_MODE === 'development') {
        console.log('📱 SMS Service (Development Mode):');
        console.log(`To: ${phoneNumber}`);
        console.log(`Message: ${message}`);
        console.log('---');
        return true;
      }

      // For production, use actual SMS service
      const sms = this.africasTalking.SMS;
      const response = await sms.send({
        to: phoneNumber,
        message: message,
        from: this.config.from
      });

      // Check if SMS was sent successfully
      if (response.SMSMessageData && response.SMSMessageData.Recipients) {
        const recipient = response.SMSMessageData.Recipients[0];
        const success = recipient.status === 'Success';

        if (success) {
          console.log(`✅ SMS sent successfully to ${phoneNumber}`);
        } else {
          console.log(`❌ SMS failed to ${phoneNumber}: ${recipient.status}`);
        }

        return success;
      }

      return false;
    } catch (error) {
      console.error('SMS Service Error:', error);
      return false;
    }
  }

  async sendWelcomeMessage(phoneNumber: string, name: string, password: string): Promise<boolean> {
    const message = `Welcome to Nappyhood Salon, ${name}! Your account has been created. Login with phone: ${phoneNumber} and password: ${password}. Please change your password after first login.`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendPasswordReset(phoneNumber: string, newPassword: string): Promise<boolean> {
    const message = `Your Nappyhood Salon password has been reset. New password: ${newPassword}. Please login and change it immediately.`;
    return this.sendSMS(phoneNumber, message);
  }
}

export const smsService = new SMSService();
export default smsService;