import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetEmailParametersQuery } from '../get-email-parameters.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { EmailParametersService } from '../../email-parameters.service'

@QueryHandler(GetEmailParametersQuery)
export class GetEmailParametersHandler implements IQueryHandler<GetEmailParametersQuery> {
  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    private readonly emailParametersService: EmailParametersService,
  ) {}

  async execute(query: GetEmailParametersQuery): Promise<any> {
    await this.permissionChecker.check(query.user, 'EmailParameters', 'Read')
    return this.emailParametersService.findByTenant(query.user.tenantId)
  }
}
