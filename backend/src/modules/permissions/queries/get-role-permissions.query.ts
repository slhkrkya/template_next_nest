import { IQuery } from '@nestjs/cqrs';
import { AuthenticatedUser } from '../../../common/types';

export class GetRolePermissionsQuery implements IQuery {
  constructor(
    public readonly requester: AuthenticatedUser,
    public readonly roleId: string,
  ) {}
}
