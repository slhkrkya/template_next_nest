import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../domain/auth.repository.interface';
import { GetMeQuery } from '../get-me.query';

@Injectable()
@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery> {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
  ) {}

  async execute(query: GetMeQuery): Promise<Record<string, unknown>> {
    const user = await this.authRepo.findUserWithRelations(query.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = user.role ?? 'User';

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: user.tenantId ?? undefined,
      profilePictureUrl: user.profilePicturePath ?? undefined,
      settings: user.settings ?? {
        language: 'en',
        themePreset: 'default',
        colorScheme: 'light',
        timezoneOffset: 0,
      },
    };
  }
}
