import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Injectable } from '@nestjs/common'
import { FilesService } from '../../files.service'
import { GetThumbnailQuery } from '../get-thumbnail.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'

@Injectable()
@QueryHandler(GetThumbnailQuery)
export class GetThumbnailHandler implements IQueryHandler<GetThumbnailQuery> {
  constructor(
    private readonly filesService: FilesService,
    private readonly permissionChecker: PermissionCheckerService,
  ) {}

  async execute(query: GetThumbnailQuery): Promise<string> {
    await this.permissionChecker.check(query.user, 'Files', 'Read')
    return this.filesService.getThumbnailPath(query.filename)
  }
}
