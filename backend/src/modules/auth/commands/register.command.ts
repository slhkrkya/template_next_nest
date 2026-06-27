import { ICommand } from '@nestjs/cqrs';
import { RegisterDto } from '../dto';

export class RegisterCommand implements ICommand {
  constructor(public readonly dto: RegisterDto) {}
}
