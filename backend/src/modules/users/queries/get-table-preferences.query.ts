import { IQuery } from '@nestjs/cqrs';

export class GetTablePreferencesQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly tableName: string,
  ) {}
}
