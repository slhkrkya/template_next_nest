import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from './domain/auth.repository.interface';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';
import {
  ForgotPasswordCommand,
  LoginCommand,
  LogoutCommand,
  RefreshTokenCommand,
  RegisterCommand,
  ResetPasswordCommand,
  VerifyEmailCommand,
} from './commands';
import { GetMeQuery } from './queries';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    private readonly configService: ConfigService,
  ) {}

  login(dto: LoginDto, res: Response) {
    return this.commandBus.execute(new LoginCommand(dto, res));
  }

  register(dto: RegisterDto) {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  verifyEmail(dto: VerifyEmailDto) {
    return this.commandBus.execute(new VerifyEmailCommand(dto));
  }

  logout(userId: string, res: Response) {
    return this.commandBus.execute(new LogoutCommand(userId, res));
  }

  refreshToken(token: string, res: Response) {
    return this.commandBus.execute(new RefreshTokenCommand(token, res));
  }

  forgotPassword(dto: ForgotPasswordDto) {
    return this.commandBus.execute(new ForgotPasswordCommand(dto));
  }

  resetPassword(dto: ResetPasswordDto) {
    return this.commandBus.execute(new ResetPasswordCommand(dto));
  }

  getMe(userId: string) {
    return this.queryBus.execute(new GetMeQuery(userId));
  }

  // ---------------------------------------------------------------------------
  // Validate user credentials (used by LocalStrategy)
  // ---------------------------------------------------------------------------
  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.authRepo.findUserByEmail(
        email.toLowerCase().trim(),
      );

      if (!user || !user.passwordHash) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return null;
      }

      if (!user.isActive) {
        throw new UnauthorizedException(
          'Please verify your email address before signing in.',
        );
      }

      const { passwordHash: _ph, ...safeUser } = user;
      return safeUser;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error('validateUser error', err);
      return null;
    }
  }
}
