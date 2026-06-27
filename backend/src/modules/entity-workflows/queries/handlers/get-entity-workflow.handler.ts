import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetEntityWorkflowQuery } from '../get-entity-workflow.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { EntityWorkflowsService } from '../../entity-workflows.service'

@QueryHandler(GetEntityWorkflowQuery)
export class GetEntityWorkflowHandler implements IQueryHandler<GetEntityWorkflowQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly entityWorkflowsService: EntityWorkflowsService,
  ) {}

  async execute(query: GetEntityWorkflowQuery): Promise<any> {
    await this.permissionChecker.check(query.user, 'EntityWorkflows', 'Read')
    return this.entityWorkflowsService.findOne(query.id)
  }
}
