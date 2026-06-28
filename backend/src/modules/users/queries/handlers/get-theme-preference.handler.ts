import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/user.repository.interface';
import { GetThemePreferenceQuery } from '../get-theme-preference.query';

@QueryHandler(GetThemePreferenceQuery)
export class GetThemePreferenceHandler implements IQueryHandler<GetThemePreferenceQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  execute(query: GetThemePreferenceQuery) {
    return this.users.getThemePreference(query.userId);
  }
}
