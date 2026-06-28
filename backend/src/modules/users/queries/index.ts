export * from './get-users.query';
export * from './get-user-by-id.query';
export * from './get-table-preferences.query';
export * from './get-theme-preference.query';
export * from './handlers/get-users.handler';
export * from './handlers/get-user-by-id.handler';
export * from './handlers/get-table-preferences.handler';
export * from './handlers/get-theme-preference.handler';

import { GetUsersHandler } from './handlers/get-users.handler';
import { GetUserByIdHandler } from './handlers/get-user-by-id.handler';
import { GetTablePreferencesHandler } from './handlers/get-table-preferences.handler';
import { GetThemePreferenceHandler } from './handlers/get-theme-preference.handler';

export const QueryHandlers = [
  GetUsersHandler,
  GetUserByIdHandler,
  GetTablePreferencesHandler,
  GetThemePreferenceHandler,
];
