import { IQuery } from '@nestjs/cqrs';

export class GetThemePreferenceQuery implements IQuery {
  constructor(public readonly userId: string) {}
}
