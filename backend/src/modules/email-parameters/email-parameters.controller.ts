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
import { CurrentUser } from '../../common/decorators/current-user.decorator'
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
  @ApiOperation({ summary: "Get the current tenant's email parameters" })
  findByTenant(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetEmailParametersQuery(user))
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create or update the current tenant's email parameters" })
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmailParametersDto,
  ) {
    return this.commandBus.execute(new UpsertEmailParametersCommand(user, dto))
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete the current tenant's email parameters" })
  remove(@CurrentUser() user: AuthenticatedUser) {
    return this.commandBus.execute(new RemoveEmailParametersCommand(user))
  }
}
