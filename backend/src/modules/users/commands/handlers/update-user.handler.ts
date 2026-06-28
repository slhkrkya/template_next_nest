import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface'
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception'
import { UpdateUserCommand } from '../update-user.command'

@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(command: UpdateUserCommand) {
    const { id, dto } = command

    const existing = await this.users.findById(id)
    if (!existing) throw new EntityNotFoundException('User', id)
    if (command.tenantId !== undefined && existing.tenantId !== command.tenantId) {
      throw new ForbiddenException('Access denied')
    }

    const updated = await this.users.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: dto.isActive,
    })

    return updated.toPlain()
  }
}

