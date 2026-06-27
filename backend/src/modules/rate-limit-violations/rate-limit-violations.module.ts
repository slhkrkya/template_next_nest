import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { RateLimitViolationsService } from './rate-limit-violations.service'
import { RateLimitViolationsController } from './rate-limit-violations.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { RATE_LIMIT_VIOLATION_REPOSITORY } from './domain/rate-limit-violation.repository.interface'
import { PrismaRateLimitViolationRepository } from './infrastructure/prisma-rate-limit-violation.repository'
import { GetRateLimitViolationsHandler } from './queries/handlers'
import { DismissViolationHandler, BulkDismissViolationsHandler, ClearOldViolationsHandler } from './commands/handlers'

const QueryHandlers = [GetRateLimitViolationsHandler]

const CommandHandlers = [DismissViolationHandler, BulkDismissViolationsHandler, ClearOldViolationsHandler]

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [RateLimitViolationsController],
  providers: [
    RateLimitViolationsService,
    { provide: RATE_LIMIT_VIOLATION_REPOSITORY, useClass: PrismaRateLimitViolationRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [RateLimitViolationsService],
})
export class RateLimitViolationsModule {}
