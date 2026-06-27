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
@WebSocketGateway({ namespace: '/notifications', cors: true })
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name)

  @WebSocketServer()
  server: Server

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() payload: JoinPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `user-${payload.userId}`
    client.join(room)
    this.logger.log(`Client ${client.id} joined notifications room: ${room}`)
  }

  sendNotification(userId: string, notification: any): void {
    const room = `user-${userId}`
    this.server.to(room).emit('new-notification', notification)
    this.logger.log(`Sent notification to room: ${room}`)
  }
}
