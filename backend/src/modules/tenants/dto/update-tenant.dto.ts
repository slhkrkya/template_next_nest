import { PartialType } from '@nestjs/swagger'
import { CreateTenantDto } from './create-tenant.dto'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsIn } from 'class-validator'

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({ enum: ['active', 'inactive', 'suspended', 'trial'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'suspended', 'trial'])
  status?: string
}
