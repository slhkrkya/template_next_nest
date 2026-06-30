import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { CommandHandlers } from './commands';
import { QueryHandlers } from './queries';
import { ROLE_REPOSITORY } from './domain/role.repository.interface';
import { PrismaRoleRepository } from './infrastructure/prisma-role.repository';
import { PERMISSION_REPOSITORY } from '../permissions/domain/permission.repository.interface';
import { PrismaPermissionRepository } from '../permissions/infrastructure/prisma-permission.repository';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [CqrsModule, PrismaModule, WebsocketsModule],
  controllers: [RolesController],
  providers: [
    RolesService,
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: PERMISSION_REPOSITORY, useClass: PrismaPermissionRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    RolesService,
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
  ],
})
export class RolesModule {}
