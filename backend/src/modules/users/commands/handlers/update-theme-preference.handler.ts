import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/user.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { UpdateThemePreferenceCommand } from '../update-theme-preference.command';

@Injectable()
@CommandHandler(UpdateThemePreferenceCommand)
export class UpdateThemePreferenceHandler implements ICommandHandler<UpdateThemePreferenceCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(command: UpdateThemePreferenceCommand) {
    const existing = await this.users.findById(command.userId);
    if (!existing) throw new EntityNotFoundException('User', command.userId);

    return this.users.updateThemePreference(command.userId, command.dto);
  }
}
