import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class RemoveEmailParametersCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
  ) {}
}
