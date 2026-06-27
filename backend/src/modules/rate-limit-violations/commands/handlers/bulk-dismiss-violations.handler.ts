import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { BulkDismissViolationsCommand } from '../bulk-dismiss-violations.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { RateLimitViolationsService } from '../../rate-limit-violations.service'

@CommandHandler(BulkDismissViolationsCommand)
export class BulkDismissViolationsHandler implements ICommandHandler<BulkDismissViolationsCommand> {
  private readonly logger = new Logger(BulkDismissViolationsHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly rateLimitViolationsService: RateLimitViolationsService,
  ) {}

  async execute(command: BulkDismissViolationsCommand): Promise<{ count: number }> {
    await this.permissionChecker.check(command.user, 'RateLimits', 'Update')
    const result = await this.rateLimitViolationsService.bulkDismiss(command.ids)
    this.logger.log(`Bulk dismissed ${command.ids.length} rate limit violations by user ${command.user.id}`)
    return result
  }
}
