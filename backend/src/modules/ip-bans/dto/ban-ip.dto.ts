import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength, Matches } from 'class-validator'

export class BanIpDto {
  @ApiProperty({ example: '192.168.1.100' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  ip: string

  @ApiPropertyOptional({ example: 'Repeated brute-force login attempts' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string

  @ApiPropertyOptional({ description: 'Ban expiry date; omit for permanent ban', example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string
}
