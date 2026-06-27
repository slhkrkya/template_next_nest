import { ICommand } from '@nestjs/cqrs';

export class SaveTablePreferencesCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly tableName: string,
    public readonly visibleColumns: string[],
  ) {}
}
