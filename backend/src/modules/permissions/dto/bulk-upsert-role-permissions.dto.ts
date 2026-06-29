import { IsUUID, IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUpsertRolePermissionItemDto {
  @IsString()
  entityName: string;

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
}

export class BulkUpsertRolePermissionsDto {
  @IsUUID()
  roleId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertRolePermissionItemDto)
  permissions: BulkUpsertRolePermissionItemDto[];
}
