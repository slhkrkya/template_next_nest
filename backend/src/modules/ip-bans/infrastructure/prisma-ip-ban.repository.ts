import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { IIpBanRepository } from '../domain/ip-ban.repository.interface'
import { IpBanEntity, IpBanProps } from '../domain/ip-ban.entity'

@Injectable()
export class PrismaIpBanRepository implements IIpBanRepository {
  constructor(private readonly prismaService: PrismaService) {}
  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }
  private toEntity(r: any): IpBanEntity {
    return new IpBanEntity({ id: r.id, ipAddress: r.ipAddress, reason: r.reason ?? null, bannedBy: r.bannedBy ?? null, tenantId: r.tenantId ?? null, createdAt: r.createdAt, expiresAt: r.expiresAt ?? null })
  }
  async findAll(tenantId?: string): Promise<IpBanEntity[]> {
    const data = await this.prisma.bannedIp.findMany({ where: tenantId ? { tenantId } : {}, orderBy: { createdAt: 'desc' } })
    return data.map(r => this.toEntity(r))
  }
  async findByIp(ipAddress: string): Promise<IpBanEntity | null> {
    const r = await this.prisma.bannedIp.findFirst({ where: { ipAddress } })
    return r ? this.toEntity(r) : null
  }
  async create(data: Omit<IpBanProps, 'id' | 'createdAt'>): Promise<IpBanEntity> {
    const r = await this.prisma.bannedIp.create({ data: { id: crypto.randomUUID(), ...data } })
    return this.toEntity(r)
  }
  async delete(id: string): Promise<void> { await this.prisma.bannedIp.delete({ where: { id } }) }
  async isIpBanned(ipAddress: string): Promise<boolean> {
    const r = await this.prisma.bannedIp.findFirst({ where: { ipAddress, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } })
    return !!r
  }
}
