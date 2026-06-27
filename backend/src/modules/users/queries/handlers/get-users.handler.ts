import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface'
import { GetUsersQuery } from '../get-users.query'

@Injectable()
@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(query: GetUsersQuery) {
    const result = await this.users.findMany({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      tenantId: query.tenantId,
    })

    return {
      data: result.data.map(u => u.toPlain()),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  }
}

