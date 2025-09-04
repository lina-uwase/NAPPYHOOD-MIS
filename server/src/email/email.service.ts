import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    // For development, we'll use a simple SMTP configuration
    // You can configure this with your email provider (Gmail, SendGrid, etc.)
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    try {
      const resetUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:4200')}/reset-password?token=${token}`;
      
      // For development - just log the email instead of sending
      this.logger.log('='.repeat(80));
      this.logger.log('📧 PASSWORD RESET EMAIL (Development Mode)');
      this.logger.log('='.repeat(80));
      this.logger.log(`To: ${email}`);
      this.logger.log(`Subject: Password Reset Request - NAPPYHOOD`);
      this.logger.log('');
      this.logger.log(`Hello ${firstName},`);
      this.logger.log('');
      this.logger.log('You have requested to reset your password. Click the link below to reset your password:');
      this.logger.log('');
      this.logger.log(`🔗 RESET LINK: ${resetUrl}`);
      this.logger.log('');
      this.logger.log('This link will expire in 1 hour.');
      this.logger.log('If you didn\'t request this password reset, please ignore this email.');
      this.logger.log('='.repeat(80));
      
      // In production, you would uncomment this:
      // const mailOptions = {
      //   from: this.configService.get('SMTP_FROM', 'noreply@nappyhood.com'),
      //   to: email,
      //   subject: 'Password Reset Request - NAPPYHOOD',
      //   html: `...`
      // };
      // await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`✅ Password reset email logged for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to process password reset email for ${email}:`, error);
    }
  }

  async send2FASetupEmail(email: string, firstName: string): Promise<void> {
    try {
      const loginUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:4200')}/login`;
      
      // For development - just log the email instead of sending
      this.logger.log('='.repeat(80));
      this.logger.log('📧 2FA SETUP EMAIL (Development Mode)');
      this.logger.log('='.repeat(80));
      this.logger.log(`To: ${email}`);
      this.logger.log(`Subject: 2FA Setup Required - NAPPYHOOD`);
      this.logger.log('');
      this.logger.log(`Hello ${firstName},`);
      this.logger.log('');
      this.logger.log('Your account has been successfully created! For security purposes, you need to set up Two-Factor Authentication (2FA).');
      this.logger.log('Please log in to your account and follow the 2FA setup instructions.');
      this.logger.log('');
      this.logger.log(`🔗 LOGIN LINK: ${loginUrl}`);
      this.logger.log('');
      this.logger.log('Important: 2FA setup is required before you can access all features of your account.');
      this.logger.log('='.repeat(80));
      
      this.logger.log(`✅ 2FA setup email logged for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to process 2FA setup email for ${email}:`, error);
    }
  }
}


