import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class UnbanIpCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly ip: string,
  ) {}
}
