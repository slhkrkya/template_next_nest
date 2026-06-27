import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { SubscriptionPlansService } from './subscription-plans.service'
import { SubscriptionPlansController } from './subscription-plans.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { SUBSCRIPTION_PLAN_REPOSITORY } from './domain/subscription-plan.repository.interface'
import { PrismaSubscriptionPlanRepository } from './infrastructure/prisma-subscription-plan.repository'
import {
  GetSubscriptionPlansHandler,
  GetSubscriptionPlanHandler,
} from './cqrs/queries'
import {
  CreateSubscriptionPlanHandler,
  UpdateSubscriptionPlanHandler,
  DeactivateSubscriptionPlanHandler,
} from './cqrs/commands'

const QueryHandlers = [
  GetSubscriptionPlansHandler,
  GetSubscriptionPlanHandler,
]

const CommandHandlers = [
  CreateSubscriptionPlanHandler,
  UpdateSubscriptionPlanHandler,
  DeactivateSubscriptionPlanHandler,
]

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [SubscriptionPlansController],
  providers: [
    SubscriptionPlansService,
    { provide: SUBSCRIPTION_PLAN_REPOSITORY, useClass: PrismaSubscriptionPlanRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {}
