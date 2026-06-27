import { EmailParametersEntity, EmailParametersProps } from './email-parameters.entity'
export const EMAIL_PARAMETERS_REPOSITORY = Symbol('IEmailParametersRepository')
export interface IEmailParametersRepository {
  findByTenantId(tenantId: string): Promise<EmailParametersEntity | null>
  upsert(data: Omit<EmailParametersProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailParametersEntity>
  delete(tenantId: string): Promise<void>
}
