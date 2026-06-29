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
@WebSocketGateway({ namespace: '/permissions', cors: true })
export class PermissionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PermissionsGateway.name)

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
      this.logger.debug(`Client ${client.id} connected to /permissions (user: ${payload.sub})`)
    } catch {
      this.logger.warn(`Client ${client.id} rejected — invalid token`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client ${client.id} disconnected from /permissions`)
  }

  /** Notify a specific user their permissions changed. */
  notifyPermissionsUpdated(userId: string): void {
    this.server
      .to(`user-${userId}`)
      .emit('permissions-updated', { userId, timestamp: new Date().toISOString() })
    this.logger.debug(`permissions-updated → user-${userId}`)
  }

  /** Broadcast to all connected clients (e.g. after a role permission change). */
  broadcastPermissionsUpdated(): void {
    this.server.emit('permissions-updated', { timestamp: new Date().toISOString() })
    this.logger.debug('permissions-updated → broadcast (role change)')
  }
}
