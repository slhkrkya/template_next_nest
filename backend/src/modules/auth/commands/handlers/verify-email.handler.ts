import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../domain/auth.repository.interface';
import { VerifyEmailCommand } from '../verify-email.command';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../tenants/domain/tenant.repository.interface';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '../../../permissions/domain/permission.repository.interface';
import { IRoleRepository, ROLE_REPOSITORY } from '../../../roles/domain/role.repository.interface';

interface EmailVerificationPayload {
  sub: string;
  email: string;
  purpose: string;
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: IPermissionRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: IRoleRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<{ message: string }> {
    const { token } = command.dto;
    let payload: EmailVerificationPayload;

    try {
      payload = await this.jwtService.verifyAsync<EmailVerificationPayload>(
        token,
        {
          secret: this.configService.get<string>('JWT_SECRET', 'default-secret'),
        },
      );
    } catch {
      throw new BadRequestException('Invalid or expired verification link');
    }

    if (payload.purpose !== 'email-verification') {
      throw new BadRequestException('Invalid or expired verification link');
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const user = await this.authRepo.findUserByEmail(normalizedEmail);

    if (!user || user.id !== payload.sub) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    await this.uow.runInTransaction(async () => {
      // 1. Tenant'ı aktifleştir
      if (user.tenantId) {
        await this.tenantRepo.update(user.tenantId, { isActive: true });
      }

      // 2. 'Admin' operationClaim ata (self-registered user = tenant owner)
      const defaultClaimAssigned = await this.authRepo.assignOperationClaimByName(
        user.id,
        'Admin',
        user.tenantId,
      );

      if (!defaultClaimAssigned) {
        throw new InternalServerErrorException(
          'Default user permissions are not configured.',
        );
      }

      // 3. Role permission'larını kullanıcıya sync et
      if (user.tenantId) {
        const userRole = await this.roleRepo.findByName('Admin');
        if (userRole) {
          await this.permissionRepo.syncRolePermissionsToUser(
            userRole.id,
            user.id,
            user.tenantId,
          );
        }
      }

      // 4. Kullanıcıyı aktifleştir
      if (!user.isActive) {
        await this.authRepo.activateUser(user.id);
      }
    });

    return {
      message: 'Email verified successfully. You can now sign in.',
    };
  }
}
