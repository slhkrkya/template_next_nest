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

export class UpsertRolePermissionDto {
  @IsUUID()
  roleId: string;

  @IsString()
  entityName: string;

  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;

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
