import { IpBanEntity, IpBanProps } from './ip-ban.entity'
export const IP_BAN_REPOSITORY = Symbol('IIpBanRepository')
export interface IIpBanRepository {
  findAll(tenantId?: string): Promise<IpBanEntity[]>
  findByIp(ipAddress: string): Promise<IpBanEntity | null>
  create(data: Omit<IpBanProps, 'id' | 'createdAt'>): Promise<IpBanEntity>
  delete(id: string): Promise<void>
  isIpBanned(ipAddress: string): Promise<boolean>
}
