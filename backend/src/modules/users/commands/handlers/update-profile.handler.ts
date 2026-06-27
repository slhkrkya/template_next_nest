import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { UpdateProfileCommand } from '../update-profile.command';

@Injectable()
@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(command: UpdateProfileCommand) {
    const { userId, dto } = command;

    const existing = await this.users.findById(userId);
    if (!existing) throw new EntityNotFoundException('User', userId);

    const updated = await this.users.update(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return updated.toPlain();
  }
}

