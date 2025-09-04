import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import {
  LoginDto,
  LoginWith2FADto,
  LoginResponseDto,
  TwoFactorRequiredDto,
} from './dto/login.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  SetInitialPasswordDto,
} from './dto/password-reset.dto';
import {
  Setup2FADto,
  Verify2FADto,
  UseRecoveryCodeDto,
  Setup2FAResponseDto,
  Enable2FAResponseDto,
} from './dto/two-factor.dto';
import { RefreshTokenDto, RefreshTokenResponseDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) { }

  async login(loginDto: LoginDto): Promise<LoginResponseDto | TwoFactorRequiredDto> {
    const { email, password } = loginDto;

    // Find user with account and role
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        account: true,
        role: true,
      },
    });

    // Dev admin fallback (no DB) using ENV credentials
    if (!user) {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
      if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
        const mockUser = {
          id: 'admin-dev',
          email: adminEmail,
          firstName: 'Admin',
          lastName: 'User',
          role: { name: 'ADMIN', privileges: [] },
          account: { is2FAEnabled: false },
        } as any;
        return this.generateTokens(mockUser, true);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.account.accountVerified) {
      throw new UnauthorizedException('Account not verified. Please check your email.');
    }

    if (!user.account.password) {
      throw new UnauthorizedException('Password not set. Please check your email for setup instructions.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.account.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.account.is2FAEnabled) {
      const tempToken = uuidv4();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

      await this.prisma.account.update({
        where: { userId: user.id },
        data: {
          otpTempToken: tempToken,
          otpExpiresAt: expiresAt,
        },
      });

      return {
        requires2FA: true,
        tempToken,
        message: 'Please enter your 2FA code',
      };
    }

    return this.generateTokens(user);
  }

  async loginWith2FA(loginWith2FADto: LoginWith2FADto): Promise<LoginResponseDto> {
    const { email, password, totpCode } = loginWith2FADto;

    // First verify credentials
    const loginResult = await this.login({ email, password });

    if ('requires2FA' in loginResult) {
      // Now verify the TOTP code
      return this.verify2FA({
        tempToken: loginResult.tempToken,
        totpCode,
      });
    }

    throw new BadRequestException('2FA is not enabled for this account');
  }

  async verify2FA(verify2FADto: Verify2FADto): Promise<LoginResponseDto> {
    const { tempToken, totpCode } = verify2FADto;

    console.log(verify2FADto);

    const account = await this.prisma.account.findFirst({
      where: {
        otpTempToken: tempToken,
        otpExpiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    const isValidTotp = speakeasy.totp.verify({
      secret: account.twoFASecret,
      encoding: 'base32',
      token: totpCode,
      window: 2, 
    });

    if (!isValidTotp) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.prisma.account.update({
      where: { userId: account.userId },
      data: {
        otpTempToken: null,
        otpExpiresAt: null,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: account.userId },
      include: { account: true, role: true },
    });

    return this.generateTokens(user);
  }

  async useRecoveryCode(useRecoveryCodeDto: UseRecoveryCodeDto): Promise<LoginResponseDto> {
    const { tempToken, recoveryCode } = useRecoveryCodeDto;

    // Find account with temp token
    const account = await this.prisma.account.findFirst({
      where: {
        otpTempToken: tempToken,
        otpExpiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
        recoveryCodes: {
          where: {
            used: false,
          },
        },
      },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    // Find matching recovery code
    const validRecoveryCode = account.recoveryCodes.find(
      (code) => code.code === recoveryCode && !code.used,
    );

    if (!validRecoveryCode) {
      throw new UnauthorizedException('Invalid recovery code');
    }

    // Mark recovery code as used
    await this.prisma.recoveryCode.update({
      where: { id: validRecoveryCode.id },
      data: { used: true },
    });

    await this.prisma.account.update({
      where: { userId: account.userId },
      data: {
        otpTempToken: null,
        otpExpiresAt: null,
      },
    });

    return this.generateTokens(account.user);
  }

  private async generateTokens(user: any, skipPersist: boolean = false): Promise<LoginResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      privileges: user.role.privileges,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Store refresh token when a backing account exists
    if (!skipPersist) {
      try {
        await this.prisma.account.update({
          where: { userId: user.id },
          data: { refreshToken },
        });
      } catch (_e) {
        // ignore in dev without DB
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: {
          name: user.role.name,
          privileges: user.role.privileges,
        },
      },
      twoFactorEnabled: !!user.account?.is2FAEnabled,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find user and verify refresh token
      const account = await this.prisma.account.findFirst({
        where: {
          userId: payload.sub,
          refreshToken,
        },
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!account) {
        // Allow dev admin refresh based on token only
        if (payload.sub === 'admin-dev') {
          const mockUser = {
            id: 'admin-dev',
            email: payload.email,
            firstName: 'Admin',
            lastName: 'User',
            role: { name: 'ADMIN', privileges: [] },
            account: { is2FAEnabled: false },
          } as any;
          const tokens = await this.generateTokens(mockUser, true);
          return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
        }
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(account.user);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.account.update({
      where: { userId },
      data: {
        refreshToken: null,
        otpTempToken: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto): Promise<{ message: string }> {
    const { email } = requestPasswordResetDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user || !user.account) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.account.update({
      where: { userId: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const account = await this.prisma.account.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!account) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await this.prisma.account.update({
      where: { userId: account.userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async setInitialPassword(setInitialPasswordDto: SetInitialPasswordDto): Promise<{ message: string }> {
    const { token, password } = setInitialPasswordDto;

    const account = await this.prisma.account.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
        accountVerified: false,
      },
      include: { user: true },
    });

    if (!account) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update account
    await this.prisma.account.update({
      where: { userId: account.userId },
      data: {
        password: hashedPassword,
        accountVerified: true,
        accountVerifiedAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send 2FA setup email
    await this.emailService.send2FASetupEmail(
      account.user.email,
      account.user.firstName,
    );

    return { message: 'Password set successfully. Please check your email for 2FA setup instructions.' };
  }

  async setup2FA(userId: string): Promise<Setup2FAResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { account: true },
    });

    if (!user || !user.account) {
      throw new NotFoundException('User not found');
    }

    if (user.account.is2FAEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate secret
    const issuer = this.configService.get<string>('APP_NAME', 'NAPPYHOOD MIS');
    const secret = speakeasy.generateSecret({
      name: `${issuer}: ${user.email}`,
      issuer,
      length: 32,
    });

    // Store temporary secret (not yet enabled)
    await this.prisma.account.update({
      where: { userId },
      data: {
        twoFASecret: secret.base32,
      },
    });

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataURL,
      manualEntryKey: secret.otpauth_url,
    };
  }

  async enable2FA(userId: string, setup2FADto: Setup2FADto): Promise<Enable2FAResponseDto> {
    const { totpCode } = setup2FADto;

    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account || !account.twoFASecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    if (account.is2FAEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Verify TOTP code
    const isValidTotp = speakeasy.totp.verify({
      secret: account.twoFASecret,
      encoding: 'base32',
      token: totpCode,
      window: 2,
    });

    if (!isValidTotp) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 8 }, () => {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      return code;
    });

    // Enable 2FA and save recovery codes
    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { userId },
        data: {
          is2FAEnabled: true,
        },
      });

      await tx.recoveryCode.createMany({
        data: recoveryCodes.map((code) => ({
          accountId: userId,
          code,
        })),
      });
    });

    return {
      message: '2FA has been enabled successfully',
      recoveryCodes,
    };
  }

  async disable2FA(userId: string, totpCode: string): Promise<{ message: string }> {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account || !account.is2FAEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify TOTP code
    const isValidTotp = speakeasy.totp.verify({
      secret: account.twoFASecret,
      encoding: 'base32',
      token: totpCode,
      window: 2,
    });

    if (!isValidTotp) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Disable 2FA and remove recovery codes
    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { userId },
        data: {
          is2FAEnabled: false,
          twoFASecret: null,
        },
      });

      await tx.recoveryCode.deleteMany({
        where: { accountId: userId },
      });
    });

    return { message: '2FA has been disabled successfully' };
  }

  async regenerateRecoveryCodes(userId: string, totpCode: string): Promise<{ recoveryCodes: string[] }> {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account || !account.is2FAEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify TOTP code
    const isValidTotp = speakeasy.totp.verify({
      secret: account.twoFASecret,
      encoding: 'base32',
      token: totpCode,
      window: 2,
    });

    if (!isValidTotp) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Generate new recovery codes
    const recoveryCodes = Array.from({ length: 8 }, () => {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      return code;
    });

    // Replace recovery codes
    await this.prisma.$transaction(async (tx) => {
      await tx.recoveryCode.deleteMany({
        where: { accountId: userId },
      });

      await tx.recoveryCode.createMany({
        data: recoveryCodes.map((code) => ({
          accountId: userId,
          code,
        })),
      });
    });

    return { recoveryCodes };
  }
}