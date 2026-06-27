import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { CreateEntityWorkflowDto } from '../dto/create-entity-workflow.dto'

export class CreateEntityWorkflowCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: CreateEntityWorkflowDto,
  ) {}
}
