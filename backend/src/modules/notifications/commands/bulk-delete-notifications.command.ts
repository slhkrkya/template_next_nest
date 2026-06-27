import { ICommand } from '@nestjs/cqrs'

export class BulkDeleteNotificationsCommand implements ICommand {
  constructor(
    public readonly ids: string[],
    public readonly userId: string,
  ) {}
}
