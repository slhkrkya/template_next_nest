import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface'
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception'
import { DeleteUserCommand } from '../delete-user.command'
import { UserDeletedEvent } from '../../domain/events/user-deleted.event'

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteUserCommand) {
    const { id } = command

    const user = await this.users.findById(id)
    if (!user) throw new EntityNotFoundException('User', id)

    await this.users.delete(id)
    this.eventBus.publish(new UserDeletedEvent(id, user.tenantId))
  }
}
