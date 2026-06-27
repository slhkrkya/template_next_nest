import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { Response } from 'express'
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthenticatedUser } from '../../common/types'
import { UploadFileCommand } from './commands'
import { GetFileQuery, GetThumbnailQuery } from './queries'
import * as path from 'path'
import * as crypto from 'crypto'

function generateFilename(_req: any, file: Express.Multer.File, cb: Function) {
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
  const ext = path.extname(file.originalname).toLowerCase()
  cb(null, `${uniqueSuffix}${ext}`)
}

// Archives removed — executables in zip/tar/gz pose extraction risks
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt',
]

const ALLOWED_MIMETYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
]

function fileFilter(_req: any, file: Express.Multer.File, cb: Function) {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new BadRequestException(`File extension "${ext}" is not allowed`), false)
  }
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(new BadRequestException(`MIME type "${file.mimetype}" is not allowed`), false)
  }
  cb(null, true)
}

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a single file (returns path and optional thumbnail URL)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = process.env.UPLOAD_DIR || 'uploads'
          cb(null, uploadDir)
        },
        filename: generateFilename,
      }),
      fileFilter,
      limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10) },
    }),
  )
  async uploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.commandBus.execute(new UploadFileCommand(user, file))
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Serve an uploaded file by filename' })
  @ApiParam({ name: 'filename', type: String })
  async serveFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath: string = await this.queryBus.execute(new GetFileQuery(user, filename))
    return res.sendFile(path.resolve(filePath))
  }

  @Get('thumbnails/:filename')
  @ApiOperation({ summary: 'Serve a thumbnail by filename' })
  @ApiParam({ name: 'filename', type: String })
  async serveThumbnail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath: string = await this.queryBus.execute(new GetThumbnailQuery(user, filename))
    return res.sendFile(path.resolve(filePath))
  }
}
