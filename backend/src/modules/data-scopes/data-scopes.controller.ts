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
import { CurrentUser } from '../../common/decorators/current-user.decorator'
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
  getUserDataScopes(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.queryBus.execute(new GetUserDataScopesQuery(user, userId))
  }

  @Post()
  upsertDataScope(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDataScopeDto,
  ) {
    return this.commandBus.execute(new UpsertDataScopeCommand(user, dto))
  }

  @Delete(':userId/:entityName')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeDataScope(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('entityName') entityName: string,
  ) {
    return this.commandBus.execute(new RemoveDataScopeCommand(user, userId, entityName))
  }
}
