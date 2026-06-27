import { ICommand } from '@nestjs/cqrs'
import { AuthenticatedUser } from '../../../common/types'

export class UploadFileCommand implements ICommand {
  constructor(
    public readonly user: AuthenticatedUser,
    public readonly file: Express.Multer.File,
  ) {}
}
