import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { PrismaModule } from '../../prisma/prisma.module'
import {
  GetDashboardStatsHandler,
  GetAuditLogsHandler,
  GetSystemLogsHandler,
  GetDailyLoginStatsHandler,
} from './queries/handlers'
import { CommandHandlers } from './commands'

const QueryHandlers = [
  GetDashboardStatsHandler,
  GetAuditLogsHandler,
  GetSystemLogsHandler,
  GetDailyLoginStatsHandler,
]

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [AdminController],
  providers: [AdminService, ...QueryHandlers, ...CommandHandlers],
  exports: [AdminService],
})
export class AdminModule {}
