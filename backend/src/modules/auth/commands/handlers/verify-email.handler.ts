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
      const defaultClaimAssigned = await this.authRepo.assignOperationClaimByName(
        user.id,
        'User',
        user.tenantId,
      );

      if (!defaultClaimAssigned) {
        throw new InternalServerErrorException(
          'Default user permissions are not configured.',
        );
      }

      if (!user.isActive) {
        await this.authRepo.activateUser(user.id);
      }
    });

    return {
      message: 'Email verified successfully. You can now sign in.',
    };
  }
}
