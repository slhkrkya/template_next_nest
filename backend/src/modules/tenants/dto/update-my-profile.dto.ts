import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'Acme Corporation' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  logoUrl?: string | null
}
