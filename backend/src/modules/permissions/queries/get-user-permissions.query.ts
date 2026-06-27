import { IQuery } from '@nestjs/cqrs';
import { AuthenticatedUser } from '../../../common/types';

export class GetUserPermissionsQuery implements IQuery {
  constructor(
    public readonly requester: AuthenticatedUser,
    public readonly userId: string,
    public readonly tenantId?: string | null,
  ) {}
}
