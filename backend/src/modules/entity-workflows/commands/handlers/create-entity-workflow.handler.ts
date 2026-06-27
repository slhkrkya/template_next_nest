import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { CreateEntityWorkflowCommand } from '../create-entity-workflow.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { EntityWorkflowsService } from '../../entity-workflows.service'

@CommandHandler(CreateEntityWorkflowCommand)
export class CreateEntityWorkflowHandler implements ICommandHandler<CreateEntityWorkflowCommand> {
  private readonly logger = new Logger(CreateEntityWorkflowHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly entityWorkflowsService: EntityWorkflowsService,
  ) {}

  async execute(command: CreateEntityWorkflowCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'EntityWorkflows', 'Create')
    const result = await this.entityWorkflowsService.create(command.dto)
    this.logger.log(`EntityWorkflow created by user ${command.user.id}: ${result.id}`)
    return result
  }
}
