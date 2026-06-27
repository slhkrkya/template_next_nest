import { IQuery } from '@nestjs/cqrs';
import { AuthenticatedUser } from '../../../common/types';

export class GetAllEntitiesQuery implements IQuery {
  constructor(public readonly requester: AuthenticatedUser) {}
}
