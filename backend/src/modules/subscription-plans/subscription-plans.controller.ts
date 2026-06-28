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
  UseGuards,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthenticatedUser } from '../../common/types'
import { SuperAdminGuard } from '../../common/guards/superadmin.guard'
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'
import {
  GetSubscriptionPlansQuery,
  GetSubscriptionPlanQuery,
} from './cqrs/queries'
import {
  CreateSubscriptionPlanCommand,
  UpdateSubscriptionPlanCommand,
  DeactivateSubscriptionPlanCommand,
} from './cqrs/commands'

@UseGuards(SuperAdminGuard)
@ApiTags('subscription-plans')
@ApiBearerAuth()
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all subscription plans (paginated)' })
  findAll(
    @Query() query: PaginationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.queryBus.execute(new GetSubscriptionPlansQuery(query, currentUser))
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.queryBus.execute(new GetSubscriptionPlanQuery(id, currentUser))
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan (SuperAdmin only)' })
  create(
    @Body() dto: CreateSubscriptionPlanDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.commandBus.execute(new CreateSubscriptionPlanCommand(dto, currentUser))
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription plan' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateSubscriptionPlanDto>,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.commandBus.execute(new UpdateSubscriptionPlanCommand(id, dto, currentUser))
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a subscription plan (sets isActive=false)' })
  @ApiParam({ name: 'id', type: String })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.commandBus.execute(new DeactivateSubscriptionPlanCommand(id, currentUser))
  }
}
