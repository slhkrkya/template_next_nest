import { DomainEventBase } from '../../../../core/domain/domain-event.base'

export class NotificationCreatedEvent extends DomainEventBase {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly tenantId: string | null,
  ) {
    super(notificationId)
  }
}
