import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateEntityWorkflowDto } from './dto/create-entity-workflow.dto'
import { EntityWorkflowsQueryDto } from './entity-workflows.service'
import { GetUser, RequirePermission } from '../../common/decorators'
import { AuthenticatedUser } from '../../common/types'
import { GetEntityWorkflowsQuery, GetEntityWorkflowQuery } from './queries'
import {
  CreateEntityWorkflowCommand,
  UpdateEntityWorkflowCommand,
  DeleteEntityWorkflowCommand,
} from './commands'

@ApiTags('entity-workflows')
@ApiBearerAuth()
@Controller('entity-workflows')
export class EntityWorkflowsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermission('EntityWorkflows', 'read')
  @ApiOperation({ summary: 'List entity workflows, optionally filtered by tenantId and entityName' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'entityName', required: false })
  findAll(
    @GetUser() user: AuthenticatedUser,
    @Query() query: EntityWorkflowsQueryDto,
  ) {
    return this.queryBus.execute(new GetEntityWorkflowsQuery(user, query))
  }

  @Get(':id')
  @RequirePermission('EntityWorkflows', 'read')
  @ApiOperation({ summary: 'Get an entity workflow by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @GetUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.queryBus.execute(new GetEntityWorkflowQuery(user, id))
  }

  @Post()
  @RequirePermission('EntityWorkflows', 'create')
  @ApiOperation({ summary: 'Create a new entity workflow' })
  create(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: CreateEntityWorkflowDto,
  ) {
    return this.commandBus.execute(new CreateEntityWorkflowCommand(user, dto))
  }

  @Patch(':id')
  @RequirePermission('EntityWorkflows', 'update')
  @ApiOperation({ summary: 'Update an entity workflow' })
  @ApiParam({ name: 'id', type: String })
  update(
    @GetUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateEntityWorkflowDto>,
  ) {
    return this.commandBus.execute(new UpdateEntityWorkflowCommand(user, id, dto))
  }

  @Delete(':id')
  @RequirePermission('EntityWorkflows', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an entity workflow' })
  @ApiParam({ name: 'id', type: String })
  remove(
    @GetUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commandBus.execute(new DeleteEntityWorkflowCommand(user, id))
  }
}
