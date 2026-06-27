import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, Max, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateEmailParametersDto {
  @ApiProperty({ example: 'smtp.example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  smtpHost: string

  @ApiProperty({ example: 587 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort: number

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean

  @ApiProperty({ example: 'no-reply@example.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  smtpUser: string

  @ApiProperty({ example: 'secret_password' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  smtpPass: string

  @ApiPropertyOptional({ example: 'Acme <no-reply@example.com>' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromName?: string

  @ApiPropertyOptional({ example: 'no-reply@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromEmail?: string
}
