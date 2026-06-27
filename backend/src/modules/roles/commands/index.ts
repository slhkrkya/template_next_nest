export * from './create-role.command';
export * from './update-role.command';
export * from './delete-role.command';
export * from './assign-role-to-user.command';
export * from './remove-role-from-user.command';
export * from './handlers/create-role.handler';
export * from './handlers/update-role.handler';
export * from './handlers/delete-role.handler';
export * from './handlers/assign-role-to-user.handler';
export * from './handlers/remove-role-from-user.handler';

import { CreateRoleHandler } from './handlers/create-role.handler';
import { UpdateRoleHandler } from './handlers/update-role.handler';
import { DeleteRoleHandler } from './handlers/delete-role.handler';
import { AssignRoleToUserHandler } from './handlers/assign-role-to-user.handler';
import { RemoveRoleFromUserHandler } from './handlers/remove-role-from-user.handler';

export const CommandHandlers = [
  CreateRoleHandler,
  UpdateRoleHandler,
  DeleteRoleHandler,
  AssignRoleToUserHandler,
  RemoveRoleFromUserHandler,
];
