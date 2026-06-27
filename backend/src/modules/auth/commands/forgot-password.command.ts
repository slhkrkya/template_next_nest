import { ICommand } from '@nestjs/cqrs';
import { ForgotPasswordDto } from '../dto';

export class ForgotPasswordCommand implements ICommand {
  constructor(public readonly dto: ForgotPasswordDto) {}
}
