import { ICommand } from '@nestjs/cqrs';
import { ChangePasswordDto } from '../dto';

export class ChangePasswordCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly dto: ChangePasswordDto,
  ) {}
}
