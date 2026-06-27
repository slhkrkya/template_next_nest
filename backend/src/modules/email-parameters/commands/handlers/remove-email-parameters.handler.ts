import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RemoveEmailParametersCommand } from '../remove-email-parameters.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { EmailParametersService } from '../../email-parameters.service'

@CommandHandler(RemoveEmailParametersCommand)
export class RemoveEmailParametersHandler implements ICommandHandler<RemoveEmailParametersCommand> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly emailParametersService: EmailParametersService,
  ) {}

  async execute(command: RemoveEmailParametersCommand): Promise<void> {
    await this.permissionChecker.check(command.user, 'EmailParameters', 'Delete')
    await this.emailParametersService.remove(command.user.tenantId)
  }
}
