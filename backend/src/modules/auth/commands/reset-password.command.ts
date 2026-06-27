import { ICommand } from '@nestjs/cqrs';
import { ResetPasswordDto } from '../dto';

export class ResetPasswordCommand implements ICommand {
  constructor(public readonly dto: ResetPasswordDto) {}
}
