import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TenantsService } from './tenants.service'
import { TenantsController } from './tenants.controller'
import { TENANT_REPOSITORY } from './domain/tenant.repository.interface'
import { PrismaTenantRepository } from './infrastructure/prisma-tenant.repository'
import { PrismaModule } from '../../prisma/prisma.module'

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
  imports: [PrismaModule, CqrsModule],
  controllers: [TenantsController],
  providers: [
    TenantsService,
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
