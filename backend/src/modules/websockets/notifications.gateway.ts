import { Injectable, Logger } from '@nestjs/common'
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Server, Socket } from 'socket.io'

@Injectable()
@WebSocketGateway({ namespace: '/notifications', cors: true })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name)

  @WebSocketServer()
  server: Server

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined
    if (!token) {
      client.disconnect()
      return
    }
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      })
      client.data.userId = payload.sub
      client.join(`user-${payload.sub}`)
      this.logger.debug(`Client ${client.id} connected to /notifications (user: ${payload.sub})`)
    } catch {
      this.logger.warn(`Client ${client.id} rejected — invalid token`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client ${client.id} disconnected from /notifications`)
  }

  sendNotification(userId: string, notification: any): void {
    this.server.to(`user-${userId}`).emit('new-notification', notification)
    this.logger.debug(`new-notification → user-${userId}`)
  }
}
