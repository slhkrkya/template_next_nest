import { VerifyEmailDto } from '../dto';

export class VerifyEmailCommand {
  constructor(public readonly dto: VerifyEmailDto) {}
}
