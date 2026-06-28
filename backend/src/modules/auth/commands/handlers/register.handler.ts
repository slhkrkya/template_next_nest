import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as bcrypt from 'bcryptjs';
import { TenantStatus } from '../../../tenants/domain/tenant.entity';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../domain/auth.repository.interface';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterCommand } from '../register.command';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';
import { CaptchaService } from '../../../../common/captcha';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../tenants/domain/tenant.repository.interface';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: ITenantRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly captchaService: CaptchaService,
  ) {}

  async execute(command: RegisterCommand): Promise<{ message: string }> {
    const { dto } = command;

    await this.captchaService.verify(dto.captchaToken);

    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.authRepo.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException(
        'An account with this email address already exists',
      );
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    let createdUser: Awaited<ReturnType<IAuthRepository['createUser']>>;
    try {
      createdUser = await this.uow.runInTransaction(async () => {
        const slug = this.generateSlug(dto.companyName);
        const tenant = await this.tenantRepo.create({
          name: dto.companyName.trim(),
          slug,
          status: 'TRIAL' as TenantStatus,
          isActive: false,
          maxUsers: 10,
          logoPath: null,
          trialEndsAt: null,
        });

        return this.authRepo.createUser({
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: normalizedEmail,
          passwordHash,
          isActive: false,
          tenantId: tenant.id,
        });
      });
    } catch (err) {
      this.logger.error('Failed to create user and tenant during registration', err);
      throw new InternalServerErrorException(
        'Registration is currently unavailable. Please try again later.',
      );
    }

    const verificationToken = await this.jwtService.signAsync(
      { sub: createdUser.id, email: normalizedEmail, purpose: 'email-verification' },
      {
        secret: this.configService.get<string>('JWT_SECRET', 'default-secret'),
        expiresIn: this.configService.get<string>('EMAIL_VERIFICATION_EXPIRES_IN', '24h'),
      },
    );

    try {
      await this.mailService.sendEmailVerification(
        normalizedEmail,
        dto.firstName.trim(),
        verificationToken,
        this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
      );
    } catch (err) {
      this.logger.error(
        `Verification email failed for ${normalizedEmail} (userId: ${createdUser.id}). User and tenant created but unverified.`,
        err,
      );
    }

    return {
      message: 'Registration successful. Please verify your email address.',
    };
  }

  private generateSlug(companyName: string): string {
    const base = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    return `${base}-${suffix}`;
  }
}
