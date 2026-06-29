import { ICommand } from '@nestjs/cqrs';
import { BulkUpsertRolePermissionsDto } from '../dto/bulk-upsert-role-permissions.dto';
import { AuthenticatedUser } from '../../../common/types';

export class BulkUpsertRolePermissionsCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: BulkUpsertRolePermissionsDto,
  ) {}
}
