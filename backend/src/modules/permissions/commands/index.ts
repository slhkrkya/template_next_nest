export * from './upsert-user-permission.command';
export * from './upsert-role-permission.command';
export * from './bulk-upsert-user-permissions.command';
export * from './bulk-upsert-role-permissions.command';
export * from './bulk-delete-user-permissions.command';
export * from './bulk-delete-role-permissions.command';
export * from './sync-role-permissions-to-user.command';

export * from './handlers/upsert-user-permission.handler';
export * from './handlers/upsert-role-permission.handler';
export * from './handlers/bulk-upsert-user-permissions.handler';
export * from './handlers/bulk-upsert-role-permissions.handler';
export * from './handlers/bulk-delete-user-permissions.handler';
export * from './handlers/bulk-delete-role-permissions.handler';
export * from './handlers/sync-role-permissions-to-user.handler';

import { UpsertUserPermissionHandler } from './handlers/upsert-user-permission.handler';
import { UpsertRolePermissionHandler } from './handlers/upsert-role-permission.handler';
import { BulkUpsertUserPermissionsHandler } from './handlers/bulk-upsert-user-permissions.handler';
import { BulkUpsertRolePermissionsHandler } from './handlers/bulk-upsert-role-permissions.handler';
import { BulkDeleteUserPermissionsHandler } from './handlers/bulk-delete-user-permissions.handler';
import { BulkDeleteRolePermissionsHandler } from './handlers/bulk-delete-role-permissions.handler';
import { SyncRolePermissionsToUserHandler } from './handlers/sync-role-permissions-to-user.handler';

export const CommandHandlers = [
  UpsertUserPermissionHandler,
  UpsertRolePermissionHandler,
  BulkUpsertUserPermissionsHandler,
  BulkUpsertRolePermissionsHandler,
  BulkDeleteUserPermissionsHandler,
  BulkDeleteRolePermissionsHandler,
  SyncRolePermissionsToUserHandler,
];
