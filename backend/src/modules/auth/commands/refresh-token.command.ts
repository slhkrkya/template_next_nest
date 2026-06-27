import { ICommand } from '@nestjs/cqrs';
import { Response } from 'express';

export class RefreshTokenCommand implements ICommand {
  constructor(
    public readonly refreshToken: string,
    public readonly res: Response,
  ) {}
}
