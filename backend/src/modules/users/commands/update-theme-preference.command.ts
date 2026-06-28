import { ICommand } from '@nestjs/cqrs';
import { UpdateThemePreferenceDto } from '../dto';

export class UpdateThemePreferenceCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdateThemePreferenceDto,
  ) {}
}
