import { ICommand } from '@nestjs/cqrs';

export class SyncRolePermissionsToUserCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly tenantId: string,
  ) {}
}
