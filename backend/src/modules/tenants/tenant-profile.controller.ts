import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger'
import * as path from 'path'
import * as crypto from 'crypto'
import { TenantsService } from './tenants.service'
import { UpdateMyProfileDto } from './dto/update-my-profile.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthenticatedUser } from '../../common/types'

function generateFilename(_req: any, file: Express.Multer.File, cb: Function) {
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
  const ext = path.extname(file.originalname).toLowerCase()
  cb(null, `${uniqueSuffix}${ext}`)
}

const LOGO_ALLOWED = ['.jpg', '.jpeg', '.png', '.svg', '.webp']
const LOGO_MIMETYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']

@ApiTags('tenant-profile')
@ApiBearerAuth()
@Controller('tenants/me')
export class TenantProfileController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's tenant profile" })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    if (!user.tenantId) throw new ForbiddenException('No tenant context')
    return this.tenantsService.getTenantProfile(user.tenantId)
  }

  @Patch()
  @ApiOperation({ summary: "Update the current user's tenant profile" })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    if (!user.tenantId) throw new ForbiddenException('No tenant context')
    return this.tenantsService.updateMyProfile(user.tenantId, dto)
  }

  @Post('logo')
  @ApiOperation({ summary: 'Upload a logo for the current tenant' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { logo: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
        filename: generateFilename,
      }),
      fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        if (!LOGO_ALLOWED.includes(ext) || !LOGO_MIMETYPES.includes(file.mimetype)) {
          return cb(new BadRequestException(`Only PNG, JPG, SVG, or WebP images are allowed`), false)
        }
        cb(null, true)
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadLogo(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user.tenantId) throw new ForbiddenException('No tenant context')
    if (!file) throw new BadRequestException('No file uploaded')
    return this.tenantsService.updateTenantLogo(user.tenantId, file.filename)
  }
}
