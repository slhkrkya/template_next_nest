import { ICommand } from '@nestjs/cqrs';

export class ToggleActiveUserCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly tenantId?: string,
  ) {}
}
