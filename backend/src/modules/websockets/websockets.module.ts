import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PermissionsGateway } from './permissions.gateway'
import { NotificationsGateway } from './notifications.gateway'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [PermissionsGateway, NotificationsGateway],
  exports: [PermissionsGateway, NotificationsGateway],
})
export class WebsocketsModule {}
