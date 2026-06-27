import { ICommand } from '@nestjs/cqrs';
import { UpsertRolePermissionDto } from '../dto/upsert-role-permission.dto';
import { AuthenticatedUser } from '../../../common/types';

export class UpsertRolePermissionCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: UpsertRolePermissionDto,
  ) {}
}
