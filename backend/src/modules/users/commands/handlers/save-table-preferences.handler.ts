import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface';
import { SaveTablePreferencesCommand } from '../save-table-preferences.command';

@Injectable()
@CommandHandler(SaveTablePreferencesCommand)
export class SaveTablePreferencesHandler implements ICommandHandler<SaveTablePreferencesCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(command: SaveTablePreferencesCommand) {
    return this.users.saveTablePreferences(
      command.userId,
      command.tableName,
      command.visibleColumns,
    );
  }
}

