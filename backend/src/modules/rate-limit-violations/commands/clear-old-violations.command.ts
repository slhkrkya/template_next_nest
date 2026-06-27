import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class ClearOldViolationsCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly daysOld: number,
  ) {}
}
