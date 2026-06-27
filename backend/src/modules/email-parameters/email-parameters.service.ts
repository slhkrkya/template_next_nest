import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common'
import { IEmailParametersRepository, EMAIL_PARAMETERS_REPOSITORY } from './domain/email-parameters.repository.interface'
import { CreateEmailParametersDto } from './dto/create-email-parameters.dto'

@Injectable()
export class EmailParametersService {
  private readonly logger = new Logger(EmailParametersService.name)

  constructor(
    @Inject(EMAIL_PARAMETERS_REPOSITORY) private readonly emailParams: IEmailParametersRepository,
  ) {}

  async findByTenant(tenantId: string): Promise<any> {
    const params = await this.emailParams.findByTenantId(tenantId)
    if (!params) throw new NotFoundException(`Email parameters not configured for tenant ${tenantId}`)
    return params
  }

  async upsert(tenantId: string, dto: CreateEmailParametersDto): Promise<any> {
    const result = await this.emailParams.upsert({
      tenantId,
      smtpHost: dto.smtpHost,
      smtpPort: dto.smtpPort,
      smtpUser: dto.smtpUser,
      smtpPass: dto.smtpPass,
      fromName: dto.fromName,
      fromEmail: dto.fromEmail,
      isActive: true,
    })

    this.logger.log(`Email parameters upserted for tenant ${tenantId}`)
    return result
  }

  async remove(tenantId: string): Promise<void> {
    const existing = await this.emailParams.findByTenantId(tenantId)
    if (!existing) throw new NotFoundException(`Email parameters not configured for tenant ${tenantId}`)

    await this.emailParams.delete(tenantId)
    this.logger.log(`Email parameters deleted for tenant ${tenantId}`)
  }
}
