import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { DeleteEntityWorkflowCommand } from '../delete-entity-workflow.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { EntityWorkflowsService } from '../../entity-workflows.service'

@CommandHandler(DeleteEntityWorkflowCommand)
export class DeleteEntityWorkflowHandler implements ICommandHandler<DeleteEntityWorkflowCommand> {
  private readonly logger = new Logger(DeleteEntityWorkflowHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly entityWorkflowsService: EntityWorkflowsService,
  ) {}

  async execute(command: DeleteEntityWorkflowCommand): Promise<void> {
    await this.permissionChecker.check(command.user, 'EntityWorkflows', 'Delete')
    await this.entityWorkflowsService.remove(command.id)
    this.logger.log(`EntityWorkflow deleted by user ${command.user.id}: ${command.id}`)
  }
}
