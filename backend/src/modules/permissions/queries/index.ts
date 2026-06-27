export * from './get-my-permissions.query';
export * from './get-all-entities.query';
export * from './get-user-permissions.query';
export * from './get-role-permissions.query';

export * from './handlers/get-my-permissions.handler';
export * from './handlers/get-all-entities.handler';
export * from './handlers/get-user-permissions.handler';
export * from './handlers/get-role-permissions.handler';

import { GetMyPermissionsHandler } from './handlers/get-my-permissions.handler';
import { GetAllEntitiesHandler } from './handlers/get-all-entities.handler';
import { GetUserPermissionsHandler } from './handlers/get-user-permissions.handler';
import { GetRolePermissionsHandler } from './handlers/get-role-permissions.handler';

export const QueryHandlers = [
  GetMyPermissionsHandler,
  GetAllEntitiesHandler,
  GetUserPermissionsHandler,
  GetRolePermissionsHandler,
];
