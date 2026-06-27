import {
  IsUUID,
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';

export enum DataScopeType {
  ALL = 'ALL',
  OWN = 'OWN',
  TEAM = 'TEAM',
  CUSTOM = 'CUSTOM',
}

export class CreateDataScopeDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  tenantId: string;

  @IsString()
  entityName: string;

  @IsEnum(DataScopeType)
  scopeType: DataScopeType;

  @IsObject()
  @IsOptional()
  scopeFilter?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  description?: string;
}
