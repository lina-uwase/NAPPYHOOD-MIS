import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'Nappyhood.boutique@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
      }
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    password: string,
    phone?: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Nappyhood Salon" <${process.env.EMAIL_USER || 'Nappyhood.boutique@gmail.com'}>`,
        to: email,
        subject: 'Welcome to Nappyhood Salon Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #5A8621; color: white; padding: 20px; text-align: center;">
              <h1>Welcome to Nappyhood Salon</h1>
            </div>

            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hello ${name}!</h2>

              <p>Your account has been successfully created in our salon management system.</p>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #5A8621; margin-top: 0;">Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                <p><strong>Password:</strong> <span style="background-color: #f0f0f0; padding: 5px 10px; font-family: monospace;">${password}</span></p>
              </div>

              <p>Please keep these credentials safe and change your password after your first login.</p>

              <div style="text-align: center; margin: 30px 0;">
                <p>Visit our salon management system to get started!</p>
              </div>

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
      console.log('✅ Welcome email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
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
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();