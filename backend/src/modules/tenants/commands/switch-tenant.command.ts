import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class SwitchTenantCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly tenantId: string,
  ) {}
}
