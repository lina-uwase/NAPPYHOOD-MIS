import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 202,
    description: '2FA required',
    type: TwoFactorRequiredDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('login-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with 2FA' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or 2FA code' })
  async loginWith2FA(@Body() loginWith2FADto: LoginWith2FADto) {
    return this.authService.loginWith2FA(loginWith2FADto);
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code' })
  @ApiResponse({
    status: 200,
    description: '2FA verification successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid 2FA code or token' })
  async verify2FA(@Body() verify2FADto: Verify2FADto) {
    return this.authService.verify2FA(verify2FADto);
  }

  @Post('use-recovery-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use recovery code for 2FA bypass' })
  @ApiResponse({
    status: 200,
    description: 'Recovery code accepted',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid recovery code or token' })
  async useRecoveryCode(@Body() useRecoveryCodeDto: UseRecoveryCodeDto) {
    return this.authService.useRecoveryCode(useRecoveryCodeDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('set-initial-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set initial password for new user' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async setInitialPassword(@Body() setInitialPasswordDto: SetInitialPasswordDto) {
    return this.authService.setInitialPassword(setInitialPasswordDto);
  }

  @Get('2fa/setup')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup 2FA - Get QR code and secret' })
  @ApiResponse({
    status: 200,
    description: '2FA setup information',
    type: Setup2FAResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: '2FA already enabled' })
  async setup2FA(@CurrentUser() user: any) {
    return this.authService.setup2FA(user.id);
  }

  @Post('2fa/enable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable 2FA with verification code' })
  @ApiResponse({
    status: 200,
    description: '2FA enabled successfully',
    type: Enable2FAResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code or already enabled' })
  async enable2FA(@CurrentUser() user: any, @Body() setup2FADto: Setup2FADto) {
    return this.authService.enable2FA(user.id, setup2FADto);
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        totpCode: {
          type: 'string',
          description: '6-digit TOTP code',
          example: '123456',
        },
      },
      required: ['totpCode'],
    },
  })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code or not enabled' })
  async disable2FA(@CurrentUser() user: any, @Body('totpCode') totpCode: string) {
    return this.authService.disable2FA(user.id, totpCode);
  }

  @Post('2fa/regenerate-recovery-codes')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate recovery codes' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        totpCode: {
          type: 'string',
          description: '6-digit TOTP code',
          example: '123456',
        },
      },
      required: ['totpCode'],
    },
  })
  @ApiResponse({ status: 200, description: 'Recovery codes regenerated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code or not enabled' })
  async regenerateRecoveryCodes(@CurrentUser() user: any, @Body('totpCode') totpCode: string) {
    return this.authService.regenerateRecoveryCodes(user.id, totpCode);
  }
}
