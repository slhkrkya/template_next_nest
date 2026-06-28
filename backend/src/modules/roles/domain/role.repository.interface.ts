import { RoleEntity, RoleProps } from './role.entity'

export const ROLE_REPOSITORY = Symbol('IRoleRepository')

export interface IRoleRepository {
  findById(id: string): Promise<RoleEntity | null>
  findByName(name: string): Promise<RoleEntity | null>
  findAll(): Promise<RoleEntity[]>
  create(data: Omit<RoleProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<RoleEntity>
  update(id: string, data: Partial<Pick<RoleProps, 'name' | 'description'>>): Promise<RoleEntity>
  delete(id: string): Promise<void>
  assignToUser(userId: string, roleId: string, tenantId?: string): Promise<void>
  removeFromUser(userId: string, roleId: string, tenantId?: string): Promise<void>
}
