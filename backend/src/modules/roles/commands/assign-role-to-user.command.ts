export class AssignRoleToUserCommand {
  constructor(
    public readonly roleId: string,
    public readonly userId: string,
    public readonly tenantId?: string,
  ) {}
}
