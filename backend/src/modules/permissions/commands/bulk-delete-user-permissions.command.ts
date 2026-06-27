import { ICommand } from '@nestjs/cqrs';
import { AuthenticatedUser } from '../../../common/types';

export class BulkDeleteUserPermissionsCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly ids: string[],
  ) {}
}
