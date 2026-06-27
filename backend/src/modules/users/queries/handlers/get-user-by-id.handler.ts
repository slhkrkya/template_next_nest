import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject, Injectable } from '@nestjs/common'
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface'
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception'
import { GetUserByIdQuery } from '../get-user-by-id.query'

@Injectable()
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(query: GetUserByIdQuery) {
    const user = await this.users.findById(query.id)
    if (!user) throw new EntityNotFoundException('User', query.id)
    return user.toPlain()
  }
}

