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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { UpdateTenantDto } from './dto/update-tenant.dto'
import { AuthenticatedUser } from '../../common/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

import { GetTenantsQuery, GetTenantByIdQuery } from './queries'
import {
  CreateTenantCommand,
  UpdateTenantCommand,
  DeleteTenantCommand,
  UpdateTenantStatusCommand,
  SwitchTenantCommand,
} from './commands'

class SwitchTenantDto {
  @ApiPropertyOptional()
  tenantId: string
}

class UpdateStatusDto {
  @ApiPropertyOptional({ enum: ['active', 'inactive', 'suspended', 'trial'] })
  status: string
}

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all tenants (paginated)' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationDto,
  ) {
    return this.queryBus.execute(new GetTenantsQuery(user, query))
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.queryBus.execute(new GetTenantByIdQuery(user, id))
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTenantDto,
  ) {
    return this.commandBus.execute(new CreateTenantCommand(user, dto))
  }

  @Post('switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch SuperAdmin tenant context' })
  switchTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchTenantDto,
  ) {
    return this.commandBus.execute(new SwitchTenantCommand(user, dto.tenantId))
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiParam({ name: 'id', type: String })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.commandBus.execute(new UpdateTenantCommand(user, id, dto))
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update tenant status' })
  @ApiParam({ name: 'id', type: String })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.commandBus.execute(new UpdateTenantStatusCommand(user, id, dto.status))
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a tenant' })
  @ApiParam({ name: 'id', type: String })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commandBus.execute(new DeleteTenantCommand(user, id))
  }
}
