import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { CreateEntityWorkflowDto } from '../dto/create-entity-workflow.dto'

export class UpdateEntityWorkflowCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly id: string,
    public readonly dto: Partial<CreateEntityWorkflowDto>,
  ) {}
}
