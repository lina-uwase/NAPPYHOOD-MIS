import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TemplateService } from "./template.service";
import nodemailer, { Transporter } from 'nodemailer';

interface EmailApiRequest {
  sender_name: string;
  sender_email: string;
  receiver_name: string;
  receiver_email: string;
  subject: string;
  message: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService
  ) { }

  private getSmtpConfig() {
    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = Number(this.configService.getOrThrow<string>('SMTP_PORT'));
    const user = this.configService.getOrThrow<string>('SMTP_USER');
    const pass = this.configService.getOrThrow<string>('SMTP_PASS');
    const from = this.configService.getOrThrow<string>('SMTP_FROM');
    const secure = port === 465; // true for 465, false for other ports
    return { host, port, secure, auth: { user, pass }, from };
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    const { host, port, secure, auth } = this.getSmtpConfig();
    this.transporter = nodemailer.createTransport({ host, port, secure, auth });
    return this.transporter;
  }

  private async sendEmail(
    to: string,
    receiverName: string,
    subject: string,
    templateName: string,
    templateContext: any
  ): Promise<void> {
    try {
      const body = await this.templateService.renderTemplate(templateName, templateContext);
      const { from } = this.getSmtpConfig();
      const mailOptions = {
        from,
        to,
        subject,
        html: body,
      };

      const forceSend = this.configService.get<string>('EMAIL_FORCE_SEND') === 'true';
      const isProd = this.configService.get<string>('NODE_ENV') === 'production';
      if (!isProd && !forceSend) {
        this.logger.log(
          `DEV EMAIL (Nodemailer) → To: ${to}\nSubject: ${subject}\nBody: ${body.substring(0, 500)}...`,
          'EmailService',
        );
        return;
      }

      const transporter = this.getTransporter();
      await transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}`, 'EmailService');
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendUserCreationEmail(email: string, firstName: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.configService.getOrThrow<string>('FRONTEND_URL')}/set-password?token=${verificationToken}`;

    await this.sendEmail(
      email,
      firstName,
      'Welcome! Set up your account',
      'user-creation',
      {
        firstName,
        verificationUrl,
        verificationToken,
      }
    );
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.getOrThrow<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    await this.sendEmail(
      email,
      firstName,
      'Password Reset Request',
      'password-reset',
      {
        firstName,
        resetUrl,
        resetToken,
      }
    );
  }

  // 2FA and legacy verification emails removed for NAPPYHOOD
}