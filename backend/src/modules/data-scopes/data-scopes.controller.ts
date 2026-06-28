import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { GetUser, RequirePermission } from '../../common/decorators'
import { AuthenticatedUser } from '../../common/types'
import { CreateDataScopeDto } from './dto/create-data-scope.dto'
import { GetUserDataScopesQuery } from './queries'
import { UpsertDataScopeCommand, RemoveDataScopeCommand } from './commands'

@Controller('data-scopes')
export class DataScopesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':userId')
  @RequirePermission('DataScopes', 'read')
  getUserDataScopes(
    @GetUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.queryBus.execute(new GetUserDataScopesQuery(user, userId))
  }

  @Post()
  @RequirePermission('DataScopes', 'create')
  upsertDataScope(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: CreateDataScopeDto,
  ) {
    return this.commandBus.execute(new UpsertDataScopeCommand(user, dto))
  }

  @Delete(':userId/:entityName')
  @RequirePermission('DataScopes', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeDataScope(
    @GetUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('entityName') entityName: string,
  ) {
    return this.commandBus.execute(new RemoveDataScopeCommand(user, userId, entityName))
  }
}
