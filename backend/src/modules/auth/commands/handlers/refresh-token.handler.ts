import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../domain/auth.repository.interface';
import { RefreshTokenCommand } from '../refresh-token.command';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';
import { parseDurationMs } from '../../../../common/utils/parse-duration.util';

@Injectable()
@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string }> {
    const { refreshToken: refreshTokenFromCookie, res } = command;

    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshTokenFromCookie, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedToken = await this.authRepo.findActiveRefreshToken(
      payload.sub,
      refreshTokenFromCookie,
    );

    if (!storedToken) {
      throw new UnauthorizedException(
        'Refresh token has been revoked or expired',
      );
    }

    const user = storedToken.user;
    const roleName = user.role ?? 'User';

    // Preserve the tenant context carried by the SuperAdmin refresh token.
    // SuperAdmin tenantId is stored as null in DB, so reading it from the user
    // record would reset a switched tenant context during refresh.
    const resolvedTenantId = (user.isSuperAdmin ?? false)
      ? (payload.tenantId ?? null)
      : (user.tenantId ?? null);

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: roleName,
      tenantId: resolvedTenantId,
      isSuperAdmin: user.isSuperAdmin ?? false,
    };

    const expiresInDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS', '7'),
      10,
    );
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Sign tokens before transaction (CPU-only, no DB).
    const [accessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    // Atomic: revoke old + create new. If create fails, old token is not revoked.
    await this.uow.runInTransaction(async () => {
      await this.authRepo.revokeRefreshToken(refreshTokenFromCookie);
      await this.authRepo.createRefreshToken(user.id, newRefreshToken, expiresAt);
    });

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const accessTokenMaxAge = parseDurationMs(
      this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    );
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessTokenMaxAge,
      path: '/',
    });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: expiresInDays * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    return { accessToken };
  }
}
