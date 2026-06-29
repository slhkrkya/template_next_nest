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
import { RequirePermission } from '../../common/decorators';
import { AuthenticatedUser } from '../../common/types';
import { UpsertUserPermissionDto } from './dto/upsert-user-permission.dto';
import { UpsertRolePermissionDto } from './dto/upsert-role-permission.dto';
import { BulkUpsertUserPermissionsDto } from './dto/bulk-upsert-user-permissions.dto';
import { BulkUpsertRolePermissionsDto } from './dto/bulk-upsert-role-permissions.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import {
  UpsertUserPermissionCommand,
  UpsertRolePermissionCommand,
  BulkUpsertUserPermissionsCommand,
  BulkUpsertRolePermissionsCommand,
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
  @RequirePermission('Permissions', 'read')
  getAllEntities(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetAllEntitiesQuery(user));
  }

  @Get('user/:userId')
  @RequirePermission('Permissions', 'read')
  getUserPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Request() req: any,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const tenantId: string = req.tenantId;
    return this.queryBus.execute(new GetUserPermissionsQuery(user, userId, tenantId));
  }

  @Get('role/:roleId')
  @RequirePermission('Permissions', 'read')
  getRolePermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.queryBus.execute(new GetRolePermissionsQuery(user, roleId));
  }

  @Post('user')
  @RequirePermission('Permissions', 'update')
  upsertUserPermission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertUserPermissionDto,
    @Request() req: any,
  ) {
    return this.commandBus.execute(
      new UpsertUserPermissionCommand(user, { ...dto, tenantId: req.tenantId }),
    );
  }

  @Post('role')
  @RequirePermission('Permissions', 'update')
  upsertRolePermission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertRolePermissionDto,
  ) {
    return this.commandBus.execute(new UpsertRolePermissionCommand(user, dto));
  }

  @Post('user/bulk-upsert')
  @RequirePermission('Permissions', 'update')
  bulkUpsertUserPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkUpsertUserPermissionsDto,
    @Request() req: any,
  ) {
    return this.commandBus.execute(
      new BulkUpsertUserPermissionsCommand(user, { ...dto, tenantId: req.tenantId }),
    );
  }

  @Post('role/bulk-upsert')
  @RequirePermission('Permissions', 'update')
  bulkUpsertRolePermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkUpsertRolePermissionsDto,
  ) {
    return this.commandBus.execute(new BulkUpsertRolePermissionsCommand(user, dto));
  }

  @Delete('user/bulk')
  @RequirePermission('Permissions', 'delete')
  bulkDeleteUserPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.commandBus.execute(new BulkDeleteUserPermissionsCommand(user, dto.ids));
  }

  @Delete('role/bulk')
  @RequirePermission('Permissions', 'delete')
  bulkDeleteRolePermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.commandBus.execute(new BulkDeleteRolePermissionsCommand(user, dto.ids));
  }
}
