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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger'
import { NotificationsService, NotificationsQueryDto } from './notifications.service'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { GetUser, GetTenantId, RequirePermission } from '../../common/decorators'
import { AuthenticatedUser } from '../../common/types'
import { IsArray, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean } from 'class-validator'

class BulkDeleteDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  ids: string[]
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  @RequirePermission('Notifications', 'read')
  @ApiOperation({ summary: 'Get my notifications (paginated)' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  getMyNotifications(
    @GetUser() user: AuthenticatedUser,
    @Query() query: NotificationsQueryDto,
    @GetTenantId() tenantId?: string,
  ) {
    return this.notificationsService.getMyNotifications(user.id, tenantId, query)
  }

  @Post()
  @RequirePermission('Notifications', 'create')
  @ApiOperation({ summary: 'Create a notification and optionally send via WebSocket (Admin)' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto)
  }

  @Patch('read-all')
  @RequirePermission('Notifications', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for the current user' })
  markAllRead(
    @GetUser() user: AuthenticatedUser,
    @GetTenantId() tenantId?: string,
  ) {
    return this.notificationsService.markAllRead(user.id, tenantId)
  }

  @Patch(':id/read')
  @RequirePermission('Notifications', 'update')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', type: String })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(id, user.id)
  }

  @Delete('bulk')
  @RequirePermission('Notifications', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete notifications by IDs' })
  bulkDelete(@Body() dto: BulkDeleteDto, @GetUser() user: AuthenticatedUser) {
    return this.notificationsService.bulkDelete(dto.ids, user.id)
  }
}
