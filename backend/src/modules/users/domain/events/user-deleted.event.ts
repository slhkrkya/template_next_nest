import { DomainEventBase } from '../../../../core/domain/domain-event.base'

export class UserDeletedEvent extends DomainEventBase {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string | null,
  ) {
    super(userId)
  }
}
