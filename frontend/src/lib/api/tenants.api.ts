import axiosInstance from '@/lib/axios'
import type {
  CreateTenantRequest,
  PagedResult,
  PaginationQuery,
  Tenant,
  TenantStatus,
  UpdateTenantRequest,
} from '@/types'

/**
 * Fetch a paginated, filterable list of tenants (super-admin only).
 */
export async function getTenants(
  params?: PaginationQuery & { status?: TenantStatus },
): Promise<PagedResult<Tenant>> {
  const response = await axiosInstance.get<PagedResult<Tenant>>('/tenants', {
    params,
  })
  return response.data
}

/**
 * Fetch a single tenant by ID.
 */
export async function getTenant(id: string): Promise<Tenant> {
  const response = await axiosInstance.get<Tenant>(`/tenants/${id}`)
  return response.data
}

/**
 * Create a new tenant organisation.
 */
export async function createTenant(
  data: CreateTenantRequest,
): Promise<Tenant> {
  const response = await axiosInstance.post<Tenant>('/tenants', data)
  return response.data
}

/**
 * Update metadata for an existing tenant.
 */
export async function updateTenant(
  id: string,
  data: UpdateTenantRequest,
): Promise<Tenant> {
  const response = await axiosInstance.patch<Tenant>(`/tenants/${id}`, data)
  return response.data
}

/**
 * Delete a tenant and all its associated data.
 * This action is irreversible; the backend should enforce a soft-delete.
 */
export async function deleteTenant(id: string): Promise<void> {
  await axiosInstance.delete(`/tenants/${id}`)
}

/**
 * Transition a tenant's status (e.g. TRIAL -> ACTIVE, ACTIVE -> SUSPENDED).
 */
export async function updateTenantStatus(
  id: string,
  status: TenantStatus,
): Promise<Tenant> {
  const response = await axiosInstance.patch<Tenant>(
    `/tenants/${id}/status`,
    { status },
  )
  return response.data
}
