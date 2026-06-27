import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class RemoveDataScopeCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly userId: string,
    public readonly entityName: string,
  ) {}
}
