import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, MaxLength } from 'class-validator'

export class CreateNotificationDto {
  @ApiProperty({ example: 'Your export is ready' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string

  @ApiPropertyOptional({ example: 'Click to download your export file.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string

  @ApiPropertyOptional({ example: 'info', enum: ['info', 'success', 'warning', 'error'] })
  @IsOptional()
  @IsString()
  type?: string

  @ApiProperty({ description: 'Target user ID' })
  @IsUUID()
  userId: string

  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string

  @ApiPropertyOptional({ example: '/exports/123' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean
}
