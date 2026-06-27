import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTransactionClient } from '../../../common/unit-of-work/prisma-transaction.context'
import { IEmailParametersRepository } from '../domain/email-parameters.repository.interface'
import { EmailParametersEntity, EmailParametersProps } from '../domain/email-parameters.entity'

@Injectable()
export class PrismaEmailParametersRepository implements IEmailParametersRepository {
  constructor(private readonly prismaService: PrismaService) {}
  private get prisma() {
    return getTransactionClient() ?? this.prismaService;
  }
  private toEntity(r: any): EmailParametersEntity {
    return new EmailParametersEntity({ id: r.id, tenantId: r.tenantId, smtpHost: r.smtpHost, smtpPort: r.smtpPort, smtpUser: r.smtpUser ?? null, smtpPass: r.smtpPass ?? null, fromEmail: r.fromEmail, fromName: r.fromName, isActive: r.isActive, createdAt: r.createdAt, updatedAt: r.updatedAt })
  }
  async findByTenantId(tenantId: string): Promise<EmailParametersEntity | null> {
    const r = await this.prisma.emailParameters.findUnique({ where: { tenantId } })
    return r ? this.toEntity(r) : null
  }
  async upsert(data: Omit<EmailParametersProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailParametersEntity> {
    const r = await this.prisma.emailParameters.upsert({
      where: { tenantId: data.tenantId },
      create: { id: crypto.randomUUID(), ...data },
      update: { smtpHost: data.smtpHost, smtpPort: data.smtpPort, smtpUser: data.smtpUser, smtpPass: data.smtpPass, fromEmail: data.fromEmail, fromName: data.fromName, isActive: data.isActive },
    })
    return this.toEntity(r)
  }
  async delete(tenantId: string): Promise<void> { await this.prisma.emailParameters.delete({ where: { tenantId } }) }
}
