import { AggregateRoot } from '@nestjs/cqrs'

export abstract class AggregateRootBase extends AggregateRoot {
  private readonly _id: string
  private readonly _createdAt: Date
  private _updatedAt: Date

  constructor(id: string, createdAt?: Date, updatedAt?: Date) {
    super()
    this._id = id
    this._createdAt = createdAt ?? new Date()
    this._updatedAt = updatedAt ?? new Date()
  }

  get id(): string { return this._id }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }
}
