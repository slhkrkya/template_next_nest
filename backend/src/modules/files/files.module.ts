import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { FilesService } from './files.service'
import { FilesController } from './files.controller'
import { CommandHandlers } from './commands'
import { QueryHandlers } from './queries'

@Module({
  imports: [CqrsModule],
  controllers: [FilesController],
  providers: [FilesService, ...CommandHandlers, ...QueryHandlers],
  exports: [FilesService],
})
export class FilesModule {}
