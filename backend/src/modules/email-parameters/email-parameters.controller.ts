import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { GetUser, RequirePermission } from '../../common/decorators'
import { AuthenticatedUser } from '../../common/types'
import { CreateEmailParametersDto } from './dto/create-email-parameters.dto'
import { GetEmailParametersQuery } from './queries'
import { UpsertEmailParametersCommand, RemoveEmailParametersCommand } from './commands'

@ApiTags('email-parameters')
@ApiBearerAuth()
@Controller('email-parameters')
export class EmailParametersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermission('EmailParameters', 'read')
  @ApiOperation({ summary: "Get the current tenant's email parameters" })
  findByTenant(@GetUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetEmailParametersQuery(user))
  }

  @Post()
  @RequirePermission('EmailParameters', 'create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create or update the current tenant's email parameters" })
  upsert(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: CreateEmailParametersDto,
  ) {
    return this.commandBus.execute(new UpsertEmailParametersCommand(user, dto))
  }

  @Delete()
  @RequirePermission('EmailParameters', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete the current tenant's email parameters" })
  remove(@GetUser() user: AuthenticatedUser) {
    return this.commandBus.execute(new RemoveEmailParametersCommand(user))
  }
}
