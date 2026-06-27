import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../domain/auth.repository.interface';
import { ResetPasswordCommand } from '../reset-password.command';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../common/unit-of-work';

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<{ message: string }> {
    const { dto } = command;

    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.authRepo.findValidPasswordResetToken(hashedToken);

    if (!resetToken) {
      throw new BadRequestException(
        'Password reset token is invalid or has expired',
      );
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.uow.runInTransaction(async () => {
      await this.authRepo.updatePassword(resetToken.userId, newPasswordHash);
      await this.authRepo.markPasswordResetTokenUsed(hashedToken);
      await this.authRepo.revokeAllUserRefreshTokens(resetToken.userId);
    });

    return { message: 'Password has been reset successfully. Please log in.' };
  }
}
