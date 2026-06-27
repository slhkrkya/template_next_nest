import { ICommand } from '@nestjs/cqrs'
import { CreateNotificationDto } from '../dto/create-notification.dto'

export class CreateNotificationCommand implements ICommand {
  constructor(public readonly dto: CreateNotificationDto) {}
}
