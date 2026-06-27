export * from './create-user.command';
export * from './update-user.command';
export * from './delete-user.command';
export * from './update-profile.command';
export * from './update-settings.command';
export * from './change-password.command';
export * from './save-table-preferences.command';
export * from './handlers/create-user.handler';
export * from './handlers/update-user.handler';
export * from './handlers/delete-user.handler';
export * from './handlers/update-profile.handler';
export * from './handlers/update-settings.handler';
export * from './handlers/change-password.handler';
export * from './handlers/save-table-preferences.handler';

import { CreateUserHandler } from './handlers/create-user.handler';
import { UpdateUserHandler } from './handlers/update-user.handler';
import { DeleteUserHandler } from './handlers/delete-user.handler';
import { UpdateProfileHandler } from './handlers/update-profile.handler';
import { UpdateSettingsHandler } from './handlers/update-settings.handler';
import { ChangePasswordHandler } from './handlers/change-password.handler';
import { SaveTablePreferencesHandler } from './handlers/save-table-preferences.handler';

export const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  UpdateProfileHandler,
  UpdateSettingsHandler,
  ChangePasswordHandler,
  SaveTablePreferencesHandler,
];
