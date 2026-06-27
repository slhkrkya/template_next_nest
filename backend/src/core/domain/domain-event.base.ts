export abstract class DomainEventBase {
  readonly occurredOn: Date
  readonly aggregateId: string

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId
    this.occurredOn = new Date()
  }
}
