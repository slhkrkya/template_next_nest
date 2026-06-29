import { UserEntityPermissionEntity, UserEntityPermissionProps, RoleEntityPermissionEntity, RoleEntityPermissionProps } from './permission.entity'

export const PERMISSION_REPOSITORY = Symbol('IPermissionRepository')

export type PermissionFlags = { entityName: string; canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }

export interface IPermissionRepository {
  // User permissions
  findUserPermissions(userId: string, tenantId?: string): Promise<UserEntityPermissionEntity[]>
  upsertUserPermission(data: Omit<UserEntityPermissionProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntityPermissionEntity>
  upsertManyUserPermissions(userId: string, tenantId: string | null, permissions: PermissionFlags[]): Promise<void>
  deleteUserPermissions(ids: string[]): Promise<{ count: number }>

  // Role permissions
  findRolePermissions(operationClaimId: string): Promise<RoleEntityPermissionEntity[]>
  upsertRolePermission(data: Omit<RoleEntityPermissionProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoleEntityPermissionEntity>
  upsertManyRolePermissions(operationClaimId: string, permissions: PermissionFlags[]): Promise<void>
  deleteRolePermissions(ids: string[]): Promise<{ count: number }>
  syncRolePermissionsToUser(operationClaimId: string, userId: string, tenantId?: string): Promise<void>
  clearRolePermissionsFromUser(operationClaimId: string, userId: string, tenantId?: string): Promise<void>

  // Entities list
  findAllEntities(): Promise<{ name: string; displayName: string }[]>
  findEntityByName(name: string): Promise<{ name: string; displayName: string } | null>

  // My permissions (for current user)
  getEffectivePermissions(userId: string, tenantId?: string): Promise<UserEntityPermissionEntity[]>
}
