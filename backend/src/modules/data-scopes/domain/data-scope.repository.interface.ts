import { DataScopeEntity, DataScopeProps } from './data-scope.entity'
export const DATA_SCOPE_REPOSITORY = Symbol('IDataScopeRepository')
export interface IDataScopeRepository {
  findByUser(userId: string, tenantId?: string): Promise<DataScopeEntity[]>
  upsert(data: Omit<DataScopeProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataScopeEntity>
  delete(userId: string, entityName: string, tenantId?: string): Promise<void>
}
