import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  IsEmail,
  Min,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens only' })
  slug: string

  @ApiPropertyOptional({ example: 50, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsers?: number

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string

  @ApiProperty({ example: 'John', description: 'Admin user first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  adminFirstName: string

  @ApiProperty({ example: 'Doe', description: 'Admin user last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  adminLastName: string

  @ApiProperty({ example: 'admin@acme.com', description: 'Admin user email' })
  @IsEmail()
  adminEmail: string

  @ApiProperty({ example: 'SecurePass@123', description: 'Admin user initial password' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  adminPassword: string
}
