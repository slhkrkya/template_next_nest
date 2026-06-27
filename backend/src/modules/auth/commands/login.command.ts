import { ICommand } from '@nestjs/cqrs';
import { Response } from 'express';
import { LoginDto } from '../dto';

export class LoginCommand implements ICommand {
  constructor(
    public readonly dto: LoginDto,
    public readonly res: Response,
  ) {}
}
