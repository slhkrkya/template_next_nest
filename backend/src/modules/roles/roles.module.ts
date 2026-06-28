import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { CommandHandlers } from './commands';
import { QueryHandlers } from './queries';
import { ROLE_REPOSITORY } from './domain/role.repository.interface';
import { PrismaRoleRepository } from './infrastructure/prisma-role.repository';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [RolesController],
  providers: [
    RolesService,
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    RolesService,
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
  ],
})
export class RolesModule {}
