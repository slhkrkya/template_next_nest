import { ICommand } from '@nestjs/cqrs';
import { UpdateSettingsDto } from '../dto';

export class UpdateSettingsCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdateSettingsDto,
  ) {}
}
