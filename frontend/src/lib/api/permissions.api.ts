import axiosInstance from '@/lib/axios'
import type {
  PermissionEntity,
  RoleEntityPermission,
  UpsertRolePermissionRequest,
  UpsertUserPermissionRequest,
  UserEntityPermission,
} from '@/types'

/**
 * Fetch the entity permissions that apply to the currently authenticated user.
 * Used on app boot to populate the permission store.
 */
export async function getMyPermissions(): Promise<UserEntityPermission[]> {
  const response =
    await axiosInstance.get<UserEntityPermission[]>('/permissions/my-permissions')
  return response.data
}

/**
 * Fetch the full list of permission-managed entities known to the system.
 */
export async function getAllEntities(): Promise<PermissionEntity[]> {
  const response =
    await axiosInstance.get<PermissionEntity[]>('/permissions/entities')
  return response.data
}

/**
 * Fetch entity permissions for a specific user (admin use).
 */
export async function getUserPermissions(
  userId: string,
): Promise<UserEntityPermission[]> {
  const response = await axiosInstance.get<UserEntityPermission[]>(
    `/permissions/user/${userId}`,
  )
  return response.data
}

/**
 * Fetch entity permissions that apply to a specific role.
 */
export async function getRolePermissions(
  roleId: string,
): Promise<RoleEntityPermission[]> {
  const response = await axiosInstance.get<RoleEntityPermission[]>(
    `/permissions/role/${roleId}`,
  )
  return response.data
}

/**
 * Create or update a user's entity permission record.
 */
export async function upsertUserPermission(
  data: UpsertUserPermissionRequest,
): Promise<UserEntityPermission> {
  const response = await axiosInstance.post<UserEntityPermission>(
    '/permissions/user',
    data,
  )
  return response.data
}

/**
 * Create or update a role's entity permission record.
 */
export async function upsertRolePermission(
  data: UpsertRolePermissionRequest,
): Promise<RoleEntityPermission> {
  const response = await axiosInstance.post<RoleEntityPermission>(
    '/permissions/role',
    data,
  )
  return response.data
}

/**
 * Delete multiple user entity permission records by their IDs.
 */
export async function bulkDeleteUserPermissions(
  ids: string[],
): Promise<{ count: number }> {
  const response = await axiosInstance.delete<{ count: number }>(
    '/permissions/user/bulk',
    { data: { ids } },
  )
  return response.data
}

/**
 * Delete multiple role entity permission records by their IDs.
 */
export async function bulkDeleteRolePermissions(
  ids: string[],
): Promise<{ count: number }> {
  const response = await axiosInstance.delete<{ count: number }>(
    '/permissions/role/bulk',
    { data: { ids } },
  )
  return response.data
}
