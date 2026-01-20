"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
// @ts-ignore - nodemailer types are incomplete
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
            }
        });
        console.log('📧 Email Service Initialized with User:', process.env.EMAIL_USER ? '***' + process.env.EMAIL_USER.slice(-4) : 'UNDEFINED');
    }
    async sendWelcomeEmail(email, name, password, phone) {
        try {
            const mailOptions = {
                from: `"Nappyhood Salon" <${process.env.EMAIL_USER || 'Nappyhood.boutique@gmail.com'}>`,
                to: email,
                subject: 'Welcome to Nappyhood Salon Management System',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background-color: #5A8621; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: normal;">Welcome to Nappyhood Salon</h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 22px;">Hello ${name}!</h2>

              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                Your account has been successfully created in our salon management system.
              </p>

              <!-- Credentials Section -->
              <h3 style="color: #5A8621; margin-bottom: 15px; font-size: 18px;">Your Login Credentials:</h3>

              <p style="margin: 10px 0; font-size: 16px; color: #333;">
                <strong>Email:</strong> ${email}
              </p>

              ${phone ? `<p style="margin: 10px 0; font-size: 16px; color: #333;">
                <strong>Phone:</strong> ${phone}
              </p>` : ''}

              <p style="margin: 10px 0; font-size: 16px; color: #333;">
                <strong>Password:</strong> ${password}
              </p>

              <p style="color: #666; font-size: 14px; margin: 30px 0;">
                Please keep these credentials safe and change your password after your first login.
              </p>

              <p style="color: #666; font-size: 16px; text-align: center; margin: 30px 0;">
                Visit our salon management system to get started!
              </p>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you have any questions, please contact us at
                <a href="mailto:nappyhood.boutique@gmail.com" style="color: #5A8621; text-decoration: underline;">nappyhood.boutique@gmail.com</a>
              </p>

              <p style="color: #333; font-size: 14px; margin-top: 25px;">
                Best regards,<br>
                The Nappyhood Team
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px;">
                &copy; 2025 Nappyhood Salon. All rights reserved.
              </p>
            </div>
          </div>
        `
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Welcome email sent successfully:', result.messageId);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send welcome email:', error);
            return false;
        }
    }
    async sendPasswordResetEmail(email, name, resetToken) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            const mailOptions = {
                from: `"Nappyhood Salon" <${process.env.EMAIL_USER || 'Nappyhood.boutique@gmail.com'}>`,
                to: email,
                subject: 'Password Reset - Nappyhood Salon',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #5A8621; color: white; padding: 20px; text-align: center;">
              <h1>Password Reset</h1>
            </div>

            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hello ${name}!</h2>

              <p>We received a request to reset your password for your Nappyhood Salon account.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #5A8621; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Your Password
                </a>
              </div>

              <p>If you didn't request this password reset, please ignore this email.</p>
              <p>This link will expire in 1 hour for security purposes.</p>

              <p>If you have any questions, please contact us at Nappyhood.boutique@gmail.com</p>

              <p>Best regards,<br>
              The Nappyhood Team</p>
            </div>

            <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p>&copy; 2025 Nappyhood Salon. All rights reserved.</p>
            </div>
          </div>
        `
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Password reset email sent successfully:', result.messageId);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send password reset email:', error);
            return false;
        }
    }
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connection verified successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map