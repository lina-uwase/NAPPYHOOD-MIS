import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Lina' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Uwase' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'u.lina250@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'USER', required: false })
  @IsOptional()
  @IsString()
  roleCode?: string;
}


