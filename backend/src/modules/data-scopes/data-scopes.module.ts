import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { DataScopesController } from './data-scopes.controller'
import { DataScopesService } from './data-scopes.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { DATA_SCOPE_REPOSITORY } from './domain/data-scope.repository.interface'
import { PrismaDataScopeRepository } from './infrastructure/prisma-data-scope.repository'
import { GetUserDataScopesHandler } from './queries/handlers'
import { UpsertDataScopeHandler, RemoveDataScopeHandler } from './commands/handlers'

const QueryHandlers = [GetUserDataScopesHandler]

const CommandHandlers = [UpsertDataScopeHandler, RemoveDataScopeHandler]

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [DataScopesController],
  providers: [
    DataScopesService,
    { provide: DATA_SCOPE_REPOSITORY, useClass: PrismaDataScopeRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [DataScopesService],
})
export class DataScopesModule {}
