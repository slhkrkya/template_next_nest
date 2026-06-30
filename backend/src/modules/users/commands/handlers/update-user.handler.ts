import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface'
import { IRoleRepository, ROLE_REPOSITORY } from '../../../roles/domain/role.repository.interface'
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../../permissions/domain/permission.repository.interface'
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception'
import { UpdateUserCommand } from '../update-user.command'

@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: IRoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: IPermissionRepository,
  ) {}

  async execute(command: UpdateUserCommand) {
    const { id, dto } = command

    const existing = await this.users.findById(id)
    if (!existing) throw new EntityNotFoundException('User', id)
    if (command.tenantId !== undefined && existing.tenantId !== command.tenantId) {
      throw new ForbiddenException('Access denied')
    }

    const updated = await this.users.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: dto.isActive,
      role: dto.role,
    })

    if (dto.role && dto.role !== existing.role) {
      const newRole = await this.roles.findByName(dto.role)
      if (newRole) {
        if (existing.role) {
          const oldRole = await this.roles.findByName(existing.role)
          if (oldRole) await this.roles.removeFromUser(id, oldRole.id, command.tenantId)
        }
        await this.roles.assignToUser(id, newRole.id, command.tenantId)
        await this.permissions.syncRolePermissionsToUser(newRole.id, id, command.tenantId)
      }
    }

    return updated.toPlain()
  }
}

