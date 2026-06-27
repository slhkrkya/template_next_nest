import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { UpdateTenantDto } from '../dto/update-tenant.dto'

export class UpdateTenantCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly id: string,
    public readonly dto: UpdateTenantDto,
  ) {}
}
