import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { EntityWorkflowsService } from './entity-workflows.service'
import { EntityWorkflowsController } from './entity-workflows.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { ENTITY_WORKFLOW_REPOSITORY } from './domain/entity-workflow.repository.interface'
import { PrismaEntityWorkflowRepository } from './infrastructure/prisma-entity-workflow.repository'
import { GetEntityWorkflowsHandler, GetEntityWorkflowHandler } from './queries/handlers'
import {
  CreateEntityWorkflowHandler,
  UpdateEntityWorkflowHandler,
  DeleteEntityWorkflowHandler,
} from './commands/handlers'

const QueryHandlers = [GetEntityWorkflowsHandler, GetEntityWorkflowHandler]

const CommandHandlers = [
  CreateEntityWorkflowHandler,
  UpdateEntityWorkflowHandler,
  DeleteEntityWorkflowHandler,
]

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [EntityWorkflowsController],
  providers: [
    EntityWorkflowsService,
    { provide: ENTITY_WORKFLOW_REPOSITORY, useClass: PrismaEntityWorkflowRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [EntityWorkflowsService],
})
export class EntityWorkflowsModule {}
