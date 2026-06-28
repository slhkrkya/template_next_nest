import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum AccessLevel {
  NONE = 'NONE',
  READ = 'READ',
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
}

export class UpsertUserPermissionDto {
  @IsUUID()
  userId: string;

  tenantId?: string;

  @IsString()
  entityName: string;

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @IsBoolean()
  @IsOptional()
  canRead?: boolean;

  @IsBoolean()
  @IsOptional()
  canUpdate?: boolean;

  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;

  @IsBoolean()
  @IsOptional()
  canExport?: boolean;

  @IsBoolean()
  @IsOptional()
  canImport?: boolean;
}
