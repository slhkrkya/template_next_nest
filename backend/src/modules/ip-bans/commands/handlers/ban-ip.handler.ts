import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ConflictException, Inject, Logger } from '@nestjs/common'
import { BanIpCommand } from '../ban-ip.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { IIpBanRepository, IP_BAN_REPOSITORY } from '../../domain/ip-ban.repository.interface'
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work'

@CommandHandler(BanIpCommand)
export class BanIpHandler implements ICommandHandler<BanIpCommand> {
  private readonly logger = new Logger(BanIpHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(IP_BAN_REPOSITORY) private readonly ipBans: IIpBanRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: BanIpCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'IpBans', 'Create')

    const result = await this.uow.runInTransaction(async () => {
      const existing = await this.ipBans.findByIp(command.dto.ip)
      if (existing) throw new ConflictException(`IP ${command.dto.ip} is already banned`)

      return this.ipBans.create({
        ipAddress: command.dto.ip,
        reason: command.dto.reason,
        expiresAt: command.dto.expiresAt ? new Date(command.dto.expiresAt) : null,
        tenantId: null,
        bannedBy: null,
      })
    })

    this.logger.log(`IP ban executed by user ${command.user.id}: ${command.dto.ip}`)
    return result
  }
}
