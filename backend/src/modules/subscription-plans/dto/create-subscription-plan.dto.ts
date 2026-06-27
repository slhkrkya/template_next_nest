import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Pro Plan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiPropertyOptional({ example: 'Full-featured plan for growing teams' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string

  @ApiPropertyOptional({ example: 'monthly', enum: ['monthly', 'yearly', 'lifetime'] })
  @IsOptional()
  @IsString()
  billingCycle?: string

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsers?: number

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({ description: 'JSON feature flags / limits', example: { apiAccess: true, storage: '10GB' } })
  @IsOptional()
  features?: Record<string, unknown>
}
