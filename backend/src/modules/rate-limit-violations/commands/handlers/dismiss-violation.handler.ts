import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { DismissViolationCommand } from '../dismiss-violation.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { RateLimitViolationsService } from '../../rate-limit-violations.service'

@CommandHandler(DismissViolationCommand)
export class DismissViolationHandler implements ICommandHandler<DismissViolationCommand> {
  private readonly logger = new Logger(DismissViolationHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly rateLimitViolationsService: RateLimitViolationsService,
  ) {}

  async execute(command: DismissViolationCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'RateLimits', 'Update')
    const result = await this.rateLimitViolationsService.dismiss(command.id)
    this.logger.log(`Rate limit violation ${command.id} dismissed by user ${command.user.id}`)
    return result
  }
}
