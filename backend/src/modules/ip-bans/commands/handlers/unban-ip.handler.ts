import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Logger, NotFoundException } from '@nestjs/common'
import { UnbanIpCommand } from '../unban-ip.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { IIpBanRepository, IP_BAN_REPOSITORY } from '../../domain/ip-ban.repository.interface'
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work'

@CommandHandler(UnbanIpCommand)
export class UnbanIpHandler implements ICommandHandler<UnbanIpCommand> {
  private readonly logger = new Logger(UnbanIpHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(IP_BAN_REPOSITORY) private readonly ipBans: IIpBanRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: UnbanIpCommand): Promise<void> {
    await this.permissionChecker.check(command.user, 'IpBans', 'Delete')

    await this.uow.runInTransaction(async () => {
      const ban = await this.ipBans.findByIp(command.ip)
      if (!ban) throw new NotFoundException(`IP ${command.ip} is not banned`)
      await this.ipBans.delete(ban.id)
    })

    this.logger.log(`IP unban executed by user ${command.user.id}: ${command.ip}`)
  }
}
