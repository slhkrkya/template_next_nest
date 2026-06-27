import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Injectable } from '@nestjs/common'
import { FilesService } from '../../files.service'
import { GetFileQuery } from '../get-file.query'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'

@Injectable()
@QueryHandler(GetFileQuery)
export class GetFileHandler implements IQueryHandler<GetFileQuery> {
  constructor(
    private readonly filesService: FilesService,
    private readonly permissionChecker: PermissionCheckerService,
  ) {}

  async execute(query: GetFileQuery): Promise<string> {
    await this.permissionChecker.check(query.user, 'Files', 'Read')
    return this.filesService.getFilePath(query.filename)
  }
}
