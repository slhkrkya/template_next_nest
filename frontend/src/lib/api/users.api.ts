import axiosInstance from '@/lib/axios'
import type {
  ChangePasswordRequest,
  PagedResult,
  PaginationQuery,
  TableColumnPreference,
  TablePreferences,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  UpdateThemePreferenceRequest,
  User,
  UserSettings,
  UserThemePreference,
} from '@/types'

/**
 * Fetch a paginated list of users. Admins see all users within their tenant;
 * super-admins see all users across all tenants.
 */
export async function getUsers(
  params?: PaginationQuery,
): Promise<PagedResult<User>> {
  const response = await axiosInstance.get<{
    data: User[]
    meta?: {
      totalCount: number
      page: number
      limit: number
      totalPages: number
    }
  }>('/users', {
    params: {
      ...params,
      limit: params?.pageSize,
    },
  })
  const meta = response.data.meta
  return {
    data: response.data.data,
    totalCount: meta?.totalCount ?? response.data.data.length,
    page: meta?.page ?? params?.page ?? 1,
    pageSize: meta?.limit ?? params?.pageSize ?? response.data.data.length,
    totalPages: meta?.totalPages ?? 1,
  }
}

/**
 * Fetch a single user by ID.
 */
export async function getUser(id: string): Promise<User> {
  const response = await axiosInstance.get<User>(`/users/${id}`)
  return response.data
}

/**
 * Create a new user. Payload mirrors the RegisterRequest shape but is
 * submitted by an admin rather than self-registration.
 */
export async function createUser(
  data: Partial<User> & { password: string },
): Promise<User> {
  const response = await axiosInstance.post<User>('/users', data)
  return response.data
}

/**
 * Update an existing user's fields (admin operation).
 */
export async function updateUser(
  id: string,
  data: Partial<User>,
): Promise<User> {
  const response = await axiosInstance.patch<User>(`/users/${id}`, data)
  return response.data
}

/**
 * Soft-delete a user.
 */
export async function deleteUser(id: string): Promise<void> {
  await axiosInstance.delete(`/users/${id}`)
}

/**
 * Toggle the isActive flag for a user.
 */
export async function toggleActive(id: string): Promise<User> {
  const response = await axiosInstance.patch<User>(
    `/users/${id}/toggle-active`,
  )
  return response.data
}

/**
 * Update the current user's own profile (name, avatar URL, etc.).
 */
export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<User> {
  const response = await axiosInstance.patch<User>('/users/profile', data)
  return response.data
}

/**
 * Update the current user's display / locale settings.
 */
export async function updateSettings(
  data: UpdateSettingsRequest,
): Promise<UserSettings> {
  const response = await axiosInstance.patch<UserSettings>(
    '/users/settings',
    data,
  )
  return response.data
}

export async function getThemePreference(): Promise<UserThemePreference> {
  const response = await axiosInstance.get<UserThemePreference>(
    '/users/theme-preference',
  )
  return response.data
}

export async function updateThemePreference(
  data: UpdateThemePreferenceRequest,
): Promise<UserThemePreference> {
  const response = await axiosInstance.patch<UserThemePreference>(
    '/users/theme-preference',
    data,
  )
  return response.data
}

/**
 * Change the current user's password. Requires the existing password for
 * confirmation.
 */
export async function changePassword(
  data: ChangePasswordRequest,
): Promise<{ message: string }> {
  const response = await axiosInstance.patch<{ message: string }>(
    '/users/change-password',
    data,
  )
  return response.data
}

/**
 * Retrieve the current user's saved column preferences for a named table.
 */
export async function getTablePreferences(
  tableName: string,
): Promise<TablePreferences> {
  const response = await axiosInstance.get<TablePreferences>(
    `/users/me/table-preferences/${tableName}`,
  )
  return response.data
}

/**
 * Persist column preferences (visibility, order, width) for a named table.
 */
export async function saveTablePreferences(
  tableName: string,
  columns: TableColumnPreference[],
): Promise<TablePreferences> {
  const response = await axiosInstance.put<TablePreferences>(
    `/users/me/table-preferences/${tableName}`,
    { visibleColumns: columns.map((column) => column.key) },
  )
  return response.data
}
