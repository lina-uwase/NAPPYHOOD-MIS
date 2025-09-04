import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginWith2FADto extends LoginDto {
  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6)
  totpCode: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: {
      name: string;
      privileges: string[];
    };
  };

  @ApiProperty({
    description: 'Indicates if 2FA is enabled',
    example: true,
  })
  twoFactorEnabled: boolean;
}

export class TwoFactorRequiredDto {
  @ApiProperty({
    description: 'Indicates that 2FA is required',
    example: true,
  })
  requires2FA: boolean;

  @ApiProperty({
    description: 'Temporary token for 2FA verification',
    example: 'temp_token_123',
  })
  tempToken: string;

  @ApiProperty({
    description: 'Message to display to user',
    example: 'Please enter your 2FA code',
  })
  message: string;
}