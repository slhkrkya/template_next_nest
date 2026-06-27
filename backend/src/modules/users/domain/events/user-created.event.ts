import { DomainEventBase } from '../../../../core/domain/domain-event.base'

export class UserCreatedEvent extends DomainEventBase {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string | null,
  ) {
    super(userId)
  }
}
