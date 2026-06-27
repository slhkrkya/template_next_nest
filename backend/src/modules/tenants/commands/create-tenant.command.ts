import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { CreateTenantDto } from '../dto/create-tenant.dto'

export class CreateTenantCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: CreateTenantDto,
  ) {}
}
