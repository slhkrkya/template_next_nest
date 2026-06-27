import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common'
import { IIpBanRepository, IP_BAN_REPOSITORY } from './domain/ip-ban.repository.interface'
import { BanIpDto } from './dto/ban-ip.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { paginationHelper } from '../../common/utils/pagination.util'
import { PagedResult } from '../../common/types'

@Injectable()
export class IpBansService {
  private readonly logger = new Logger(IpBansService.name)

  constructor(
    @Inject(IP_BAN_REPOSITORY) private readonly ipBans: IIpBanRepository,
  ) {}

  async findAll(query: PaginationDto): Promise<PagedResult<any>> {
    const { buildResult } = paginationHelper(query, 'createdAt')

    const data = await this.ipBans.findAll()
    return buildResult(data, data.length)
  }

  async ban(dto: BanIpDto): Promise<any> {
    const existing = await this.ipBans.findByIp(dto.ip)
    if (existing) throw new ConflictException(`IP ${dto.ip} is already banned`)

    const ban = await this.ipBans.create({
      ipAddress: dto.ip,
      reason: dto.reason,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      tenantId: null,
      bannedBy: null,
    })

    this.logger.warn(`IP banned: ${dto.ip}${dto.reason ? ` - ${dto.reason}` : ''}`)
    return ban
  }

  async unban(ip: string): Promise<void> {
    const ban = await this.ipBans.findByIp(ip)
    if (!ban) throw new NotFoundException(`IP ${ip} is not banned`)

    await this.ipBans.delete(ban.id)
    this.logger.log(`IP unbanned: ${ip}`)
  }

  async isIpBanned(ip: string): Promise<boolean> {
    return this.ipBans.isIpBanned(ip)
  }
}
