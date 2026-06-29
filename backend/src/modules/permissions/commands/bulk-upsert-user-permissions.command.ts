import { ICommand } from '@nestjs/cqrs';
import { BulkUpsertUserPermissionsDto } from '../dto/bulk-upsert-user-permissions.dto';
import { AuthenticatedUser } from '../../../common/types';

export class BulkUpsertUserPermissionsCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: BulkUpsertUserPermissionsDto & { tenantId?: string },
  ) {}
}
