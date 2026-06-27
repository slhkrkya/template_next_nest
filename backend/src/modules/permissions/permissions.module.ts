import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PERMISSION_REPOSITORY } from './domain/permission.repository.interface';
import { PrismaPermissionRepository } from './infrastructure/prisma-permission.repository';
import { CommandHandlers } from './commands';
import { QueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    { provide: PERMISSION_REPOSITORY, useClass: PrismaPermissionRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
