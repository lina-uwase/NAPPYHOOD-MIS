import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Manager' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MANAGER', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Salon manager with elevated permissions', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['USERS_READ', 'APPOINTMENTS_MANAGE'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  permissions?: string[];
}


