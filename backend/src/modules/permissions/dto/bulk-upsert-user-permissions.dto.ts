import { IsUUID, IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUpsertUserPermissionItemDto {
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

export class BulkUpsertUserPermissionsDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertUserPermissionItemDto)
  permissions: BulkUpsertUserPermissionItemDto[];
}
