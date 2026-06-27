export * from './get-all-roles.query';
export * from './get-role-by-id.query';
export * from './get-users-by-role.query';
export * from './handlers/get-all-roles.handler';
export * from './handlers/get-role-by-id.handler';
export * from './handlers/get-users-by-role.handler';

import { GetAllRolesHandler } from './handlers/get-all-roles.handler';
import { GetRoleByIdHandler } from './handlers/get-role-by-id.handler';
import { GetUsersByRoleHandler } from './handlers/get-users-by-role.handler';

export const QueryHandlers = [
  GetAllRolesHandler,
  GetRoleByIdHandler,
  GetUsersByRoleHandler,
];
