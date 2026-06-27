import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { UpsertEmailParametersCommand } from '../upsert-email-parameters.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { EmailParametersService } from '../../email-parameters.service'

@CommandHandler(UpsertEmailParametersCommand)
export class UpsertEmailParametersHandler implements ICommandHandler<UpsertEmailParametersCommand> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly emailParametersService: EmailParametersService,
  ) {}

  async execute(command: UpsertEmailParametersCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'EmailParameters', 'Update')
    return this.emailParametersService.upsert(command.user.tenantId, command.dto)
  }
}
