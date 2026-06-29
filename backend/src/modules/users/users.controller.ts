import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { GetUser, RequirePermission } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/types';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateProfileDto,
  UpdateSettingsDto,
  UpdateThemePreferenceDto,
  UpdateUserDto,
} from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('Users', 'read')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('roleId') roleId?: string,
    @GetUser() user?: AuthenticatedUser,
  ) {
    const isSuperAdmin = user?.isSuperAdmin === true;
    const tenantId = isSuperAdmin ? undefined : user?.tenantId;

    return this.usersService.findAll(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        roleId,
      },
      tenantId,
    );
  }

  @Get('me/table-preferences/:tableName')
  getTablePreferences(
    @GetUser('id') userId: string,
    @Param('tableName') tableName: string,
  ) {
    return this.usersService.getTablePreferences(userId, tableName);
  }

  @Put('me/table-preferences/:tableName')
  saveTablePreferences(
    @GetUser('id') userId: string,
    @Param('tableName') tableName: string,
    @Body('visibleColumns') visibleColumns: string[],
  ) {
    return this.usersService.saveTablePreferences(
      userId,
      tableName,
      visibleColumns,
    );
  }

  @Patch('profile')
  updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('settings')
  updateSettings(
    @GetUser('id') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(userId, dto);
  }

  @SkipThrottle()
  @Get('theme-preference')
  getThemePreference(@GetUser('id') userId: string) {
    return this.usersService.getThemePreference(userId);
  }

  @SkipThrottle()
  @Patch('theme-preference')
  updateThemePreference(
    @GetUser('id') userId: string,
    @Body() dto: UpdateThemePreferenceDto,
  ) {
    return this.usersService.updateThemePreference(userId, dto);
  }

  @Patch('change-password')
  changePassword(
    @GetUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get(':id')
  @RequirePermission('Users', 'read')
  findOne(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    const tenantId = user?.isSuperAdmin === true ? undefined : user?.tenantId ?? undefined;
    return this.usersService.findById(id, tenantId);
  }

  @Post()
  @RequirePermission('Users', 'create')
  create(
    @Body() dto: CreateUserDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    const isSuperAdmin = user?.isSuperAdmin === true;
    const tenantId = isSuperAdmin ? dto.tenantId : user?.tenantId;
    return this.usersService.createUser(dto, tenantId);
  }

  @Patch(':id')
  @RequirePermission('Users', 'update')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @GetUser() user: AuthenticatedUser) {
    const tenantId = user?.isSuperAdmin === true ? undefined : user?.tenantId ?? undefined;
    return this.usersService.updateUser(id, dto, tenantId);
  }

  @Delete(':id')
  @RequirePermission('Users', 'delete')
  softDelete(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    const tenantId = user?.isSuperAdmin === true ? undefined : user?.tenantId ?? undefined;
    return this.usersService.softDelete(id, tenantId);
  }

  @Patch(':id/toggle-active')
  @RequirePermission('Users', 'update')
  toggleActive(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    const tenantId = user?.isSuperAdmin === true ? undefined : user?.tenantId ?? undefined;
    return this.usersService.toggleActive(id, tenantId);
  }
}
