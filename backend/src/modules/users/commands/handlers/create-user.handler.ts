import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Injectable, ForbiddenException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface'
import { EntityAlreadyExistsException } from '../../../../core/exceptions/domain.exception'
import { CreateUserCommand } from '../create-user.command'
import { UserCreatedEvent } from '../../domain/events/user-created.event'
import { PrismaService } from '../../../../prisma/prisma.service'

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: CreateUserCommand) {
    const { dto, tenantId } = command
    const effectiveTenantId = dto.tenantId ?? tenantId ?? null

    const exists = await this.users.existsByEmail(dto.email)
    if (exists) throw new EntityAlreadyExistsException('User', 'email', dto.email)

    // Check tenant user limit if user belongs to a tenant
    if (effectiveTenantId) {
      await this.checkTenantUserLimit(effectiveTenantId)
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const user = await this.users.create({
      id: crypto.randomUUID(),
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
      isActive: dto.isActive ?? true,
      isSuperAdmin: false,
      tenantId: effectiveTenantId,
      role: dto.role,
    })

    this.eventBus.publish(new UserCreatedEvent(user.id, user.email, user.tenantId))

    return user.toPlain()
  }

  /**
   * Check if the tenant has reached its maximum user limit.
   * Uses subscription plan maxUsers, or falls back to tenant's maxUsers (trial limit).
   */
  private async checkTenantUserLimit(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!tenant) {
      throw new ForbiddenException('Tenant not found')
    }

    // Determine max users: active subscription plan takes precedence, fallback to tenant's maxUsers (trial)
    const activeSubscription = tenant.subscriptions[0]
    const maxUsers = activeSubscription?.plan?.maxUsers ?? tenant.maxUsers ?? 10

    // Count current active users in the tenant
    const currentUserCount = await this.prisma.user.count({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    })

    if (currentUserCount >= maxUsers) {
      throw new ForbiddenException(
        `Tenant has reached its maximum user limit (${maxUsers}). Please upgrade your subscription or contact support.`,
      )
    }
  }
}


