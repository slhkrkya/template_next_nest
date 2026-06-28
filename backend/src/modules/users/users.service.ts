import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from './commands/create-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { DeleteUserCommand } from './commands/delete-user.command';
import { ToggleActiveUserCommand } from './commands/toggle-active-user.command';
import { UpdateProfileCommand } from './commands/update-profile.command';
import { UpdateSettingsCommand } from './commands/update-settings.command';
import { UpdateThemePreferenceCommand } from './commands/update-theme-preference.command';
import { ChangePasswordCommand } from './commands/change-password.command';
import { SaveTablePreferencesCommand } from './commands/save-table-preferences.command';
import { GetUsersQuery } from './queries/get-users.query';
import { GetUserByIdQuery } from './queries/get-user-by-id.query';
import { GetTablePreferencesQuery } from './queries/get-table-preferences.query';
import { GetThemePreferenceQuery } from './queries/get-theme-preference.query';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  UpdateSettingsDto,
  UpdateThemePreferenceDto,
  ChangePasswordDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
      roleId?: string;
    },
    tenantId?: string,
  ) {
    return this.queryBus.execute(
      new GetUsersQuery(query.page, query.limit, query.search, tenantId),
    );
  }

  findById(id: string, tenantId?: string) {
    return this.queryBus.execute(new GetUserByIdQuery(id, tenantId));
  }

  createUser(dto: CreateUserDto, tenantId?: string) {
    return this.commandBus.execute(new CreateUserCommand(dto, tenantId));
  }

  updateUser(id: string, dto: UpdateUserDto, tenantId?: string) {
    return this.commandBus.execute(new UpdateUserCommand(id, dto, tenantId));
  }

  softDelete(id: string, tenantId?: string) {
    return this.commandBus.execute(new DeleteUserCommand(id, tenantId));
  }

  toggleActive(id: string, tenantId?: string) {
    return this.commandBus.execute(new ToggleActiveUserCommand(id, tenantId));
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.commandBus.execute(new UpdateProfileCommand(userId, dto));
  }

  updateSettings(userId: string, dto: UpdateSettingsDto) {
    return this.commandBus.execute(new UpdateSettingsCommand(userId, dto));
  }

  getThemePreference(userId: string) {
    return this.queryBus.execute(new GetThemePreferenceQuery(userId));
  }

  updateThemePreference(userId: string, dto: UpdateThemePreferenceDto) {
    return this.commandBus.execute(
      new UpdateThemePreferenceCommand(userId, dto),
    );
  }

  changePassword(userId: string, dto: ChangePasswordDto) {
    return this.commandBus.execute(new ChangePasswordCommand(userId, dto));
  }

  getTablePreferences(userId: string, tableName: string) {
    return this.queryBus.execute(new GetTablePreferencesQuery(userId, tableName));
  }

  saveTablePreferences(userId: string, tableName: string, visibleColumns: string[]) {
    return this.commandBus.execute(
      new SaveTablePreferencesCommand(userId, tableName, visibleColumns),
    );
  }
}
