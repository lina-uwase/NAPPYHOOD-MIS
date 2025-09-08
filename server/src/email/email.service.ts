import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TemplateService } from "./template.service";

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

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService
  ) { }

  private async sendEmail(
    to: string,
    receiverName: string,
    subject: string,
    templateName: string,
    templateContext: any
  ): Promise<void> {
    try {
      const body = await this.templateService.renderTemplate(templateName, templateContext);

      const requestData: EmailApiRequest = {
        sender_name: this.configService.getOrThrow<string>('EMAIL_SENDER_NAME'),
        sender_email: this.configService.getOrThrow<string>('EMAIL_SENDER'),
        receiver_name: receiverName,
        receiver_email: to,
        subject: subject,
        message: body,
      };

      await firstValueFrom(
        this.httpService.post(this.configService.getOrThrow<string>('EMAIL_API_URL'), requestData),
      );

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

  // 2FA is not used in NAPPYHOOD

  async sendAccountVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.configService.getOrThrow<string>('FRONTEND_URL')}/auth/verify-account?token=${verificationToken}`;

    await this.sendEmail(
      email,
      firstName,
      'Verify your account',
      'account-verification',
      {
        firstName,
        verificationUrl,
        verificationToken,
      }
    );
  }
}