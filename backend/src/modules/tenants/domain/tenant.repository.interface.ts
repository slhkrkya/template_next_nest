import { TenantEntity, TenantProps } from './tenant.entity'

export const TENANT_REPOSITORY = Symbol('ITenantRepository')

export interface FindTenantsOptions { page?: number; pageSize?: number; search?: string; status?: string }
export interface PaginatedTenants { data: TenantEntity[]; total: number; page: number; pageSize: number }

export interface ITenantRepository {
  findById(id: string): Promise<TenantEntity | null>
  findBySlug(slug: string): Promise<TenantEntity | null>
  findMany(options: FindTenantsOptions): Promise<PaginatedTenants>
  create(data: Omit<TenantProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantEntity>
  update(id: string, data: Partial<Pick<TenantProps, 'name' | 'slug' | 'logoPath' | 'status' | 'trialEndsAt' | 'maxUsers' | 'isActive'>>): Promise<TenantEntity>
  delete(id: string): Promise<void>
}
