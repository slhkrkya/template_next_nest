import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as crypto from 'crypto';
import { MailService } from '../../../mail/mail.service';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../domain/auth.repository.interface';
import { ForgotPasswordCommand } from '../forgot-password.command';

@Injectable()
@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler
  implements ICommandHandler<ForgotPasswordCommand>
{
  private readonly logger = new Logger(ForgotPasswordHandler.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<{ message: string }> {
    const { dto } = command;
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Always return success to prevent email enumeration
    const user = await this.authRepo.findUserByEmail(normalizedEmail);

    if (user && user.isActive) {
      await this.authRepo.invalidateOldPasswordResetTokens(user.id);

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.authRepo.createPasswordResetToken(
        user.id,
        user.email,
        hashedToken,
        expiresAt,
      );

      const frontendUrl = this.configService.get(
        'FRONTEND_URL',
        'http://localhost:3000',
      );

      try {
        await this.mailService.sendPasswordReset(
          user.email,
          rawToken,
          frontendUrl,
        );
      } catch (err) {
        this.logger.error(
          `Failed to send password reset email to ${user.email}`,
          err,
        );
      }
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }
}
