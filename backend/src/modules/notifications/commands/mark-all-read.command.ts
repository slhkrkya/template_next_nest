import { ICommand } from '@nestjs/cqrs'

export class MarkAllReadCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId?: string | null,
  ) {}
}
