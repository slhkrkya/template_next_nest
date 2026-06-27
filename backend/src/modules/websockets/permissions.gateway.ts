import { Injectable, Logger } from '@nestjs/common'
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

interface JoinPayload {
  userId: string
}

@Injectable()
@WebSocketGateway({ namespace: '/permissions', cors: true })
export class PermissionsGateway {
  private readonly logger = new Logger(PermissionsGateway.name)

  @WebSocketServer()
  server: Server

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() payload: JoinPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `user-${payload.userId}`
    client.join(room)
    this.logger.log(`Client ${client.id} joined permissions room: ${room}`)
  }

  notifyPermissionsUpdated(userId: string): void {
    const room = `user-${userId}`
    this.server.to(room).emit('permissions-updated', { userId, timestamp: new Date().toISOString() })
    this.logger.log(`Emitted permissions-updated to room: ${room}`)
  }
}
