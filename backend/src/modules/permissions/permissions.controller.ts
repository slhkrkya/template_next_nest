import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types';
import { UpsertUserPermissionDto } from './dto/upsert-user-permission.dto';
import { UpsertRolePermissionDto } from './dto/upsert-role-permission.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import {
  UpsertUserPermissionCommand,
  UpsertRolePermissionCommand,
  BulkDeleteUserPermissionsCommand,
  BulkDeleteRolePermissionsCommand,
} from './commands';
import {
  GetMyPermissionsQuery,
  GetAllEntitiesQuery,
  GetUserPermissionsQuery,
  GetRolePermissionsQuery,
} from './queries';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('my-permissions')
  getMyPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Request() req: any,
  ) {
    const tenantId: string = req.tenantId;
    return this.queryBus.execute(new GetMyPermissionsQuery(user.id, tenantId));
  }

  @Get('entities')
  getAllEntities(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetAllEntitiesQuery(user));
  }

  @Get('user/:userId')
  getUserPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Request() req: any,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const tenantId: string = req.tenantId;
    return this.queryBus.execute(new GetUserPermissionsQuery(user, userId, tenantId));
  }

  @Get('role/:roleId')
  getRolePermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.queryBus.execute(new GetRolePermissionsQuery(user, roleId));
  }

  @Post('user')
  upsertUserPermission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertUserPermissionDto,
  ) {
    return this.commandBus.execute(new UpsertUserPermissionCommand(user, dto));
  }

  @Post('role')
  upsertRolePermission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertRolePermissionDto,
  ) {
    return this.commandBus.execute(new UpsertRolePermissionCommand(user, dto));
  }

  @Delete('user/bulk')
  bulkDeleteUserPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.commandBus.execute(new BulkDeleteUserPermissionsCommand(user, dto.ids));
  }

  @Delete('role/bulk')
  bulkDeleteRolePermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.commandBus.execute(new BulkDeleteRolePermissionsCommand(user, dto.ids));
  }
}
