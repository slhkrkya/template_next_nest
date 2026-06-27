import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class DeleteTenantCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly id: string,
  ) {}
}
