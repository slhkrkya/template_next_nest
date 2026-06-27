import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as path from 'path'
import * as fs from 'fs'
import * as sharp from 'sharp'

export interface UploadResult {
  filename: string
  originalName: string
  mimetype: string
  size: number
  path: string
  url: string
  thumbnailUrl?: string
}

const IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff']
const THUMBNAIL_SUFFIX = '_thumb'
const THUMBNAIL_SIZE = 200

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name)
  private readonly uploadDir: string

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads')
    this.ensureUploadDirExists()
  }

  private ensureUploadDirExists(): void {
    const thumbDir = path.join(this.uploadDir, 'thumbnails')
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
      this.logger.log(`Created upload directory: ${this.uploadDir}`)
    }
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true })
    }
  }

  async handleUpload(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) throw new BadRequestException('No file provided')

    const baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3001')
    const fileUrl = `${baseUrl}/files/${file.filename}`

    let thumbnailUrl: string | undefined

    if (IMAGE_MIMETYPES.includes(file.mimetype)) {
      thumbnailUrl = await this.generateThumbnail(file, baseUrl)
    }

    this.logger.log(`File uploaded: ${file.filename} (${file.size} bytes)`)

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: fileUrl,
      thumbnailUrl,
    }
  }

  private async generateThumbnail(
    file: Express.Multer.File,
    baseUrl: string,
  ): Promise<string | undefined> {
    try {
      const ext = path.extname(file.filename)
      const baseName = path.basename(file.filename, ext)
      const thumbFilename = `${baseName}${THUMBNAIL_SUFFIX}${ext}`
      const thumbPath = path.join(this.uploadDir, 'thumbnails', thumbFilename)

      await sharp(file.path)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', position: 'center' })
        .toFile(thumbPath)

      this.logger.log(`Thumbnail generated: ${thumbFilename}`)
      return `${baseUrl}/files/thumbnails/${thumbFilename}`
    } catch (err) {
      this.logger.warn(`Failed to generate thumbnail for ${file.filename}: ${err}`)
      return undefined
    }
  }

  getFilePath(filename: string): string {
    // Prevent path traversal
    const safeName = path.basename(filename)
    const filePath = path.join(this.uploadDir, safeName)

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File "${safeName}" not found`)
    }

    return filePath
  }

  getThumbnailPath(filename: string): string {
    const safeName = path.basename(filename)
    const filePath = path.join(this.uploadDir, 'thumbnails', safeName)

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Thumbnail "${safeName}" not found`)
    }

    return filePath
  }

  deleteFile(filename: string): void {
    const safeName = path.basename(filename)
    const filePath = path.join(this.uploadDir, safeName)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      this.logger.log(`File deleted: ${safeName}`)
    }

    // Also remove thumbnail if exists
    const ext = path.extname(safeName)
    const baseName = path.basename(safeName, ext)
    const thumbPath = path.join(this.uploadDir, 'thumbnails', `${baseName}${THUMBNAIL_SUFFIX}${ext}`)
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath)
    }
  }
}
