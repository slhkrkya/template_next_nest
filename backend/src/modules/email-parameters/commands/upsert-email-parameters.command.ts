import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { CreateEmailParametersDto } from '../dto/create-email-parameters.dto'

export class UpsertEmailParametersCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: CreateEmailParametersDto,
  ) {}
}
