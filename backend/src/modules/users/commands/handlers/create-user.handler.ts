import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface'
import { EntityAlreadyExistsException } from '../../../../core/exceptions/domain.exception'
import { CreateUserCommand } from '../create-user.command'
import { UserCreatedEvent } from '../../domain/events/user-created.event'

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand) {
    const { dto, tenantId } = command

    const exists = await this.users.existsByEmail(dto.email)
    if (exists) throw new EntityAlreadyExistsException('User', 'email', dto.email)

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const user = await this.users.create({
      id: crypto.randomUUID(),
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
      isActive: true,
      isSuperAdmin: false,
      tenantId: dto.tenantId ?? tenantId ?? null,
      role: dto.role,
    })

    this.eventBus.publish(new UserCreatedEvent(user.id, user.email, user.tenantId))

    return user.toPlain()
  }
}

