import { IQuery } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'
import { EntityWorkflowsQueryDto } from '../entity-workflows.service'

export class GetEntityWorkflowsQuery implements IQuery {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly queryDto: EntityWorkflowsQueryDto,
  ) {}
}
