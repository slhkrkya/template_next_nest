import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { UpdateEntityWorkflowCommand } from '../update-entity-workflow.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { EntityWorkflowsService } from '../../entity-workflows.service'

@CommandHandler(UpdateEntityWorkflowCommand)
export class UpdateEntityWorkflowHandler implements ICommandHandler<UpdateEntityWorkflowCommand> {
  private readonly logger = new Logger(UpdateEntityWorkflowHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly entityWorkflowsService: EntityWorkflowsService,
  ) {}

  async execute(command: UpdateEntityWorkflowCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'EntityWorkflows', 'Update')
    const result = await this.entityWorkflowsService.update(command.id, command.dto)
    this.logger.log(`EntityWorkflow updated by user ${command.user.id}: ${command.id}`)
    return result
  }
}
