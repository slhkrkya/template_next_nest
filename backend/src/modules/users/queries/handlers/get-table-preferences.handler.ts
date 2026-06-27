import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface';
import { GetTablePreferencesQuery } from '../get-table-preferences.query';

@Injectable()
@QueryHandler(GetTablePreferencesQuery)
export class GetTablePreferencesHandler implements IQueryHandler<GetTablePreferencesQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(query: GetTablePreferencesQuery) {
    const prefs = await this.users.getTablePreferences(query.userId, query.tableName);
    return prefs ?? { tableName: query.tableName, visibleColumns: [] };
  }
}

