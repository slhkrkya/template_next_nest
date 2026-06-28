import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'

export class SwitchTenantDto {
  @ApiPropertyOptional({ example: 'uuid-here', description: 'Target tenant ID. Omit or set null to return to global mode.' })
  @IsOptional()
  @IsString()
  @IsUUID()
  tenantId?: string | null
}
