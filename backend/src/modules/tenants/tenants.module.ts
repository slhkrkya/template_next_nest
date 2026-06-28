import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { MulterModule } from '@nestjs/platform-express'
import { TenantsService } from './tenants.service'
import { TenantsController } from './tenants.controller'
import { TenantProfileController } from './tenant-profile.controller'
import { TENANT_REPOSITORY } from './domain/tenant.repository.interface'
import { PrismaTenantRepository } from './infrastructure/prisma-tenant.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { PermissionsModule } from '../permissions/permissions.module'
import { RolesModule } from '../roles/roles.module'
import { AUTH_REPOSITORY } from '../auth/domain/auth.repository.interface'
import { PrismaAuthRepository } from '../auth/infrastructure/prisma-auth.repository'

import { GetTenantsHandler, GetTenantByIdHandler } from './queries/handlers'
import {
  CreateTenantHandler,
  UpdateTenantHandler,
  DeleteTenantHandler,
  UpdateTenantStatusHandler,
  SwitchTenantHandler,
} from './commands/handlers'

const QueryHandlers = [GetTenantsHandler, GetTenantByIdHandler]

const CommandHandlers = [
  CreateTenantHandler,
  UpdateTenantHandler,
  DeleteTenantHandler,
  UpdateTenantStatusHandler,
  SwitchTenantHandler,
]

@Module({
  imports: [PrismaModule, CqrsModule, PermissionsModule, RolesModule, MulterModule],
  controllers: [TenantProfileController, TenantsController],
  providers: [
    TenantsService,
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [
    TenantsService,
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
  ],
})
export class TenantsModule {}
