import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsIn } from 'class-validator'
import { PaginationDto } from '../../../common/dto/pagination.dto'

export class GetViolationsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by dismissed status', enum: ['true', 'false'] })
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  dismissed?: string

  @ApiPropertyOptional({ description: 'Filter by endpoint (partial match)' })
  @IsOptional()
  @IsString()
  endpoint?: string

  @ApiPropertyOptional({ description: 'Filter by IP address (partial match)' })
  @IsOptional()
  @IsString()
  ipAddress?: string

  @ApiPropertyOptional({ description: 'Filter by HTTP method' })
  @IsOptional()
  @IsString()
  method?: string

  @ApiPropertyOptional({ description: 'Filter by rate limit policy' })
  @IsOptional()
  @IsString()
  policy?: string
}
