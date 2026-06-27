import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class DeleteEntityWorkflowCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly id: string,
  ) {}
}
