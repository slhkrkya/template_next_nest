import { Injectable, Inject } from '@nestjs/common';
import { IPermissionRepository, PERMISSION_REPOSITORY } from './domain/permission.repository.interface';
import { UpsertUserPermissionDto } from './dto/upsert-user-permission.dto';
import { UpsertRolePermissionDto } from './dto/upsert-role-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepository: IPermissionRepository,
  ) {}

  // ---------------------------------------------------------------------------
  // Direct repository delegates - thin wrappers over IPermissionRepository
  // ---------------------------------------------------------------------------

  async getMyPermissions(userId: string, tenantId?: string | null) {
    return this.permissionRepository.getEffectivePermissions(userId, tenantId ?? undefined);
  }

  async getAllEntities() {
    return this.permissionRepository.findAllEntities();
  }

  async getUserPermissions(userId: string, tenantId?: string | null) {
    return this.permissionRepository.findUserPermissions(userId, tenantId ?? undefined);
  }

  async getRolePermissions(roleId: string) {
    return this.permissionRepository.findRolePermissions(roleId);
  }

  async upsertUserPermission(dto: UpsertUserPermissionDto) {
    const { userId, tenantId, entityName, canCreate, canRead, canUpdate, canDelete } = dto;
    return this.permissionRepository.upsertUserPermission({
      userId,
      tenantId: tenantId ?? null,
      entityName,
      canCreate: canCreate ?? false,
      canRead: canRead ?? false,
      canUpdate: canUpdate ?? false,
      canDelete: canDelete ?? false,
    });
  }

  async upsertRolePermission(dto: UpsertRolePermissionDto) {
    const { roleId, entityName, canCreate, canRead, canUpdate, canDelete } = dto;
    return this.permissionRepository.upsertRolePermission({
      operationClaimId: roleId,
      entityName,
      canCreate: canCreate ?? false,
      canRead: canRead ?? false,
      canUpdate: canUpdate ?? false,
      canDelete: canDelete ?? false,
    });
  }

  async bulkDeleteUserPermissions(ids: string[]): Promise<{ count: number }> {
    return this.permissionRepository.deleteUserPermissions(ids);
  }

  async bulkDeleteRolePermissions(ids: string[]): Promise<{ count: number }> {
    return this.permissionRepository.deleteRolePermissions(ids);
  }

  async syncRolePermissionsToUser(userId: string, roleId: string, tenantId: string): Promise<void> {
    return this.permissionRepository.syncRolePermissionsToUser(roleId, userId, tenantId);
  }
}
