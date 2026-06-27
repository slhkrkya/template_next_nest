import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { UpdateSettingsCommand } from '../update-settings.command';

@Injectable()
@CommandHandler(UpdateSettingsCommand)
export class UpdateSettingsHandler implements ICommandHandler<UpdateSettingsCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(command: UpdateSettingsCommand) {
    const { userId, dto } = command;

    const existing = await this.users.findById(userId);
    if (!existing) throw new EntityNotFoundException('User', userId);

    return this.users.updateSettings(userId, {
      language: dto.language,
      themePreset: dto.themePreset,
      colorScheme: dto.colorScheme,
      timezoneOffset: dto.timezoneOffset,
    });
  }
}

