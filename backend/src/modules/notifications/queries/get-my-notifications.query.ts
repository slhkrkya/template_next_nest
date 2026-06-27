import { IQuery } from '@nestjs/cqrs'
import { NotificationsQueryDto } from '../notifications.service'

export class GetMyNotificationsQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string | null | undefined,
    public readonly queryDto: NotificationsQueryDto,
  ) {}
}
