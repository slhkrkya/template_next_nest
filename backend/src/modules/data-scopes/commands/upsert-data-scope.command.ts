import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { CreateDataScopeDto } from '../dto/create-data-scope.dto'

export class UpsertDataScopeCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: CreateDataScopeDto,
  ) {}
}
