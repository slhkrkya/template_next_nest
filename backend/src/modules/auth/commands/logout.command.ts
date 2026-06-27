import { ICommand } from '@nestjs/cqrs';
import { Response } from 'express';

export class LogoutCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly res: Response,
  ) {}
}
