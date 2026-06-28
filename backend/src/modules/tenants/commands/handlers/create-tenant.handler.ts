import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ConflictException, Inject, Logger } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { TenantStatus } from '../../domain/tenant.entity'
import { CreateTenantCommand } from '../create-tenant.command'
import { PermissionCheckerService } from '../../../../common/services/permission-checker.service'
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/tenant.repository.interface'
import { IAuthRepository, AUTH_REPOSITORY } from '../../../auth/domain/auth.repository.interface'
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../../permissions/domain/permission.repository.interface'
import { IRoleRepository, ROLE_REPOSITORY } from '../../../roles/domain/role.repository.interface'
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work'

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  private readonly logger = new Logger(CreateTenantHandler.name)

  constructor(
    private readonly permissionChecker: PermissionCheckerService,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: IPermissionRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: IRoleRepository,
  ) {}

  async execute(command: CreateTenantCommand): Promise<any> {
    await this.permissionChecker.check(command.user, 'Tenants', 'Create')

    const existingTenant = await this.tenants.findBySlug(command.dto.slug)
    if (existingTenant) {
      throw new ConflictException(`Slug "${command.dto.slug}" is already taken`)
    }

    const normalizedAdminEmail = command.dto.adminEmail.toLowerCase().trim()
    const existingUser = await this.authRepo.findUserByEmail(normalizedAdminEmail)
    if (existingUser) {
      throw new ConflictException(`A user with email "${normalizedAdminEmail}" already exists`)
    }

    const passwordHash = await bcrypt.hash(command.dto.adminPassword, 12)

    const result = await this.uow.runInTransaction(async () => {
      const tenant = await this.tenants.create({
        name: command.dto.name,
        slug: command.dto.slug,
        maxUsers: command.dto.maxUsers ?? 10,
        trialEndsAt: command.dto.trialEndsAt ? new Date(command.dto.trialEndsAt) : null,
        status: 'ACTIVE' as TenantStatus,
        isActive: true,
        logoPath: null,
      })

      const adminUser = await this.authRepo.createUser({
        firstName: command.dto.adminFirstName.trim(),
        lastName: command.dto.adminLastName.trim(),
        email: normalizedAdminEmail,
        passwordHash,
        isActive: true,
        tenantId: tenant.id,
      })

      await this.authRepo.assignOperationClaimByName(adminUser.id, 'Admin', tenant.id)

      const adminRole = await this.roleRepo.findByName('Admin')
      if (adminRole) {
        await this.permissionRepo.syncRolePermissionsToUser(adminRole.id, adminUser.id, tenant.id)
      }

      return { tenant, adminUser }
    })

    this.logger.log(
      `Tenant created: ${result.tenant.id} (${result.tenant.slug}), admin: ${result.adminUser.email}`,
    )

    return {
      id: result.tenant.id,
      name: result.tenant.name,
      slug: result.tenant.slug,
      status: result.tenant.status,
      isActive: result.tenant.isActive,
      maxUsers: result.tenant.maxUsers,
      trialEndsAt: result.tenant.trialEndsAt,
      admin: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        firstName: result.adminUser.firstName,
        lastName: result.adminUser.lastName,
      },
    }
  }
}
