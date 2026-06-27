export class RemoveRoleFromUserCommand {
  constructor(
    public readonly roleId: string,
    public readonly userId: string,
    public readonly tenantId?: string,
  ) {}
}
