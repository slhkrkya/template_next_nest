import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class ClearOldDto {
  @ApiPropertyOptional({ default: 30, description: 'Delete violations older than N days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  daysOld?: number
}
