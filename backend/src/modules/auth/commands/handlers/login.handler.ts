import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../domain/auth.repository.interface';
import { LoginCommand } from '../login.command';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';
import { CaptchaService } from '../../../../common/captcha';

const defaultThemePreference = {
  themeFamily: 'lara',
  themeName: 'indigo',
  colorScheme: 'light',
  inputStyle: 'outlined',
  ripple: true,
  scale: 14,
};

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly captchaService: CaptchaService,
  ) {}

  async execute(
    command: LoginCommand,
  ): Promise<{ accessToken: string; user: Record<string, unknown> }> {
    const { dto, res } = command;

    await this.captchaService.verify(dto.captchaToken);

    const user = await this.authRepo.findUserByEmail(
      dto.email.toLowerCase().trim(),
    );

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Your account is temporarily locked. Please try again later.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Please verify your email address before signing in.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.uow.runInTransaction(async () => {
        await this.authRepo.incrementFailedLoginAttempts(user.id);
        if (user.failedLoginAttempts + 1 >= 5) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await this.authRepo.lockUserUntil(user.id, lockUntil);
        }
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const roleName = user.role ?? 'User';
    const payload = {
      sub: user.id,
      email: user.email,
      role: roleName,
      tenantId: user.tenantId ?? null,
      isSuperAdmin: user.isSuperAdmin ?? false,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const expiresInDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS', '7'),
      10,
    );
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    await this.uow.runInTransaction(async () => {
      await this.authRepo.resetFailedLoginAttempts(user.id);
      await this.authRepo.updateLastLogin(user.id);
      await this.authRepo.revokeAllUserRefreshTokens(user.id);
      await this.authRepo.createRefreshToken(user.id, refreshToken, expiresAt);
    });

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: expiresInDays * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const userWithRelations = await this.authRepo.findUserWithRelations(user.id);
    const role = userWithRelations?.role ?? 'User';

    return {
      accessToken,
      user: {
        id: userWithRelations?.id,
        email: userWithRelations?.email,
        firstName: userWithRelations?.firstName,
        lastName: userWithRelations?.lastName,
        role,
        isSuperAdmin: userWithRelations?.isSuperAdmin,
        tenantId: userWithRelations?.tenantId ?? undefined,
        profilePictureUrl: userWithRelations?.profilePicturePath ?? undefined,
        settings: userWithRelations?.settings ?? {
          language: 'en',
          themePreset: 'default',
          colorScheme: 'light',
          timezoneOffset: 0,
        },
        themePreference: userWithRelations?.themePreference ?? defaultThemePreference,
      },
    };
  }
}
