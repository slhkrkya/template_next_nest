import { IQuery } from '@nestjs/cqrs';

export class GetMyPermissionsQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId?: string | null,
  ) {}
}
