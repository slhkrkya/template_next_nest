import { Module } from '@nestjs/common'
import { PermissionsGateway } from './permissions.gateway'
import { NotificationsGateway } from './notifications.gateway'

@Module({
  providers: [PermissionsGateway, NotificationsGateway],
  exports: [PermissionsGateway, NotificationsGateway],
})
export class WebsocketsModule {}
