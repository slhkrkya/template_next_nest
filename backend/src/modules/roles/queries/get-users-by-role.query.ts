export class GetUsersByRoleQuery {
  constructor(
    public readonly roleId: string,
    public readonly tenantId?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
