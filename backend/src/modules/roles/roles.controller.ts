import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GetUser, RequirePermission } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/types';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('Roles', 'read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermission('Roles', 'read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermission('Roles', 'create')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('Roles', 'update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('Roles', 'delete')
  remove(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }

  @Post(':id/assign-to-user/:userId')
  @RequirePermission('Roles', 'update')
  assignToUser(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const isSuperAdmin = user?.isSuperAdmin === true;
    const tenantId = isSuperAdmin ? undefined : user?.tenantId;
    return this.rolesService.assignToUser(roleId, userId, tenantId);
  }

  @Delete(':id/remove-from-user/:userId')
  @RequirePermission('Roles', 'update')
  removeFromUser(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    const isSuperAdmin = user?.isSuperAdmin === true;
    const tenantId = isSuperAdmin ? undefined : user?.tenantId;
    return this.rolesService.removeFromUser(roleId, userId, tenantId);
  }

  @Get(':id/users')
  @RequirePermission('Roles', 'read')
  getUsersByRole(
    @Param('id') roleId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @GetUser() user?: AuthenticatedUser,
  ) {
    const isSuperAdmin = user?.isSuperAdmin === true;
    const tenantId = isSuperAdmin ? undefined : user?.tenantId;
    return this.rolesService.getUsersByRole(roleId, tenantId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }
}
