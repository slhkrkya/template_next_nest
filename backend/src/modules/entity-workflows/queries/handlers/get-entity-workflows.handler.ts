import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetEntityWorkflowsQuery } from '../get-entity-workflows.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { EntityWorkflowsService } from '../../entity-workflows.service'
import { PagedResult } from '../../../../common/types'

@QueryHandler(GetEntityWorkflowsQuery)
export class GetEntityWorkflowsHandler implements IQueryHandler<GetEntityWorkflowsQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly entityWorkflowsService: EntityWorkflowsService,
  ) {}

  async execute(query: GetEntityWorkflowsQuery): Promise<PagedResult<any>> {
    await this.permissionChecker.check(query.user, 'EntityWorkflows', 'Read')
    return this.entityWorkflowsService.findAll(query.queryDto)
  }
}
