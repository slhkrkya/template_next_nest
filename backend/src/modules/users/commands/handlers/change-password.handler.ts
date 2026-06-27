import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { ChangePasswordCommand } from '../change-password.command';

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<{ message: string }> {
    const { userId, dto } = command;

    const user = await this.users.findById(userId);
    if (!user) throw new EntityNotFoundException('User', userId);

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.users.update(userId, { passwordHash: newPasswordHash });

    return { message: 'Password changed successfully' };
  }
}

