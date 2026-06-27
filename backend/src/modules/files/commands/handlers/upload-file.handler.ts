import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Injectable } from '@nestjs/common'
import { FilesService } from '../../files.service'
import { UploadFileCommand } from '../upload-file.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'

@Injectable()
@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<UploadFileCommand> {
  constructor(
    private readonly filesService: FilesService,
    private readonly permissionChecker: PermissionCheckerService,
  ) {}

  async execute(command: UploadFileCommand) {
    await this.permissionChecker.check(command.user, 'Files', 'Create')
    return this.filesService.handleUpload(command.file)
  }
}
