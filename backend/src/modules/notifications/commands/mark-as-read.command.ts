import { ICommand } from '@nestjs/cqrs'

export class MarkAsReadCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
