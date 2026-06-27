import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { ClearOldViolationsCommand } from '../clear-old-violations.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { RateLimitViolationsService } from '../../rate-limit-violations.service'

@CommandHandler(ClearOldViolationsCommand)
export class ClearOldViolationsHandler implements ICommandHandler<ClearOldViolationsCommand> {
  private readonly logger = new Logger(ClearOldViolationsHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly rateLimitViolationsService: RateLimitViolationsService,
  ) {}

  async execute(command: ClearOldViolationsCommand): Promise<{ count: number }> {
    await this.permissionChecker.check(command.user, 'RateLimits', 'Delete')
    const result = await this.rateLimitViolationsService.clearOld(command.daysOld)
    this.logger.log(`Cleared old rate limit violations (older than ${command.daysOld} days) by user ${command.user.id}`)
    return result
  }
}
