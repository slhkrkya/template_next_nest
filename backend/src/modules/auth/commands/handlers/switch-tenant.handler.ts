import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { SwitchTenantCommand } from '../switch-tenant.command'
import { IAuthRepository, AUTH_REPOSITORY } from '../../domain/auth.repository.interface'
import { ITenantRepository, TENANT_REPOSITORY } from '../../../tenants/domain/tenant.repository.interface'
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work'
import { parseDurationMs } from '../../../../common/utils/parse-duration.util'

@Injectable()
@CommandHandler(SwitchTenantCommand)
export class SwitchTenantHandler implements ICommandHandler<SwitchTenantCommand> {
  private readonly logger = new Logger(SwitchTenantHandler.name)

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: SwitchTenantCommand): Promise<{ accessToken: string; tenantId: string | null; tenantName: string | null }> {
    const { user, tenantId, res } = command

    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Only SuperAdmin can switch tenant context')
    }

    let tenantName: string | null = null
    if (tenantId) {
      const tenant = await this.tenantRepo.findById(tenantId)
      if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`)
      if (!tenant.isActive) throw new BadRequestException(`Tenant "${tenant.name}" is not active`)
      tenantName = tenant.name
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenantId ?? null,
      isSuperAdmin: true,
    }

    const expiresInDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS', '7'),
      10,
    )
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    const [accessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ])

    await this.uow.runInTransaction(async () => {
      await this.authRepo.revokeAllUserRefreshTokens(user.id)
      await this.authRepo.createRefreshToken(user.id, newRefreshToken, expiresAt)
    })

    const isProduction = this.configService.get('NODE_ENV') === 'production'
    const accessTokenMaxAge = parseDurationMs(
      this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    )
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessTokenMaxAge,
      path: '/',
    })
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: expiresInDays * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    })

    this.logger.log(
      `SuperAdmin ${user.id} switched context to tenantId: ${tenantId ?? 'global'}`,
    )

    return { accessToken, tenantId: tenantId ?? null, tenantName }
  }
}
