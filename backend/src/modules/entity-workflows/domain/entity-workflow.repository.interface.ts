import { EntityWorkflowEntity, EntityWorkflowProps } from './entity-workflow.entity'
export const ENTITY_WORKFLOW_REPOSITORY = Symbol('IEntityWorkflowRepository')
export interface IEntityWorkflowRepository {
  findByTenant(tenantId: string): Promise<EntityWorkflowEntity[]>
  findById(id: string): Promise<EntityWorkflowEntity | null>
  create(data: Omit<EntityWorkflowProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<EntityWorkflowEntity>
  update(id: string, data: Partial<EntityWorkflowProps>): Promise<EntityWorkflowEntity>
  delete(id: string): Promise<void>
}
