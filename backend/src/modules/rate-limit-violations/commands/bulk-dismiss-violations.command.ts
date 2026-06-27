import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class BulkDismissViolationsCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly ids: string[],
  ) {}
}
