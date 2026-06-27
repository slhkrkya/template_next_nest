import { IQuery } from '@nestjs/cqrs'

export class GetUsersQuery implements IQuery {
  constructor(
    public readonly page?: number,
    public readonly pageSize?: number,
    public readonly search?: string,
    public readonly tenantId?: string,
  ) {}
}
