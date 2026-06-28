import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface'
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception'
import { ToggleActiveUserCommand } from '../toggle-active-user.command'

@Injectable()
@CommandHandler(ToggleActiveUserCommand)
export class ToggleActiveUserHandler implements ICommandHandler<ToggleActiveUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(command: ToggleActiveUserCommand) {
    const user = await this.users.findById(command.id)
    if (!user) throw new EntityNotFoundException('User', command.id)

    if (command.tenantId !== undefined && user.tenantId !== command.tenantId) {
      throw new ForbiddenException('Access denied')
    }

    const updated = await this.users.update(command.id, { isActive: !user.isActive })
    return updated.toPlain()
  }
}
