import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsArray, MaxLength } from 'class-validator'

export class CreateEntityWorkflowDto {
  @ApiProperty({ description: 'Tenant that owns this workflow' })
  @IsUUID()
  tenantId: string

  @ApiProperty({ example: 'Order', description: 'Entity/model name this workflow applies to' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  entityName: string

  @ApiProperty({ example: 'Order Approval Flow' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @ApiPropertyOptional({ example: 'Multi-step approval for orders above $1000' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @ApiProperty({
    description: 'Ordered list of workflow steps',
    example: [{ step: 1, name: 'Manager Approval', role: 'Manager' }],
  })
  @IsArray()
  steps: Record<string, unknown>[]

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
