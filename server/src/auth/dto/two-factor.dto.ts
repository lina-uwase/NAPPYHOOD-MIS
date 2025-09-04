import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class Setup2FADto {
  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  totpCode: string;
}

export class Verify2FADto {
  @ApiProperty({
    description: 'Temporary token from login attempt',
    example: 'temp_token_123',
  })
  @IsString()
  tempToken: string;

  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  totpCode: string;
}

export class UseRecoveryCodeDto {
  @ApiProperty({
    description: 'Temporary token from login attempt',
    example: 'temp_token_123',
  })
  @IsString()
  tempToken: string;

  @ApiProperty({
    description: 'Recovery code',
    example: 'ABCD-1234-EFGH-5678',
  })
  @IsString()
  recoveryCode: string;
}

export class Setup2FAResponseDto {
  @ApiProperty({
    description: 'Base32 encoded secret for manual entry',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'QR code data URL for scanning',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCode: string;

  @ApiProperty({
    description: 'Backup URL for manual entry',
    example: 'otpauth://totp/MyApp:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MyApp',
  })
  manualEntryKey: string;
}

export class Enable2FAResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: '2FA has been enabled successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Recovery codes for backup access',
    example: ['ABCD-1234-EFGH-5678', 'IJKL-9012-MNOP-3456'],
    type: [String],
  })
  recoveryCodes: string[];
}
