import { ICommand } from '@nestjs/cqrs';
import { UpsertUserPermissionDto } from '../dto/upsert-user-permission.dto';
import { AuthenticatedUser } from '../../../common/types';

export class UpsertUserPermissionCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly dto: UpsertUserPermissionDto,
  ) {}
}
