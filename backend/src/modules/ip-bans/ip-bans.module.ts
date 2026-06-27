import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { IpBansService } from './ip-bans.service'
import { IpBansController } from './ip-bans.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { IP_BAN_REPOSITORY } from './domain/ip-ban.repository.interface'
import { PrismaIpBanRepository } from './infrastructure/prisma-ip-ban.repository'
import { GetIpBansHandler } from './queries/handlers'
import { BanIpHandler, UnbanIpHandler } from './commands/handlers'

const QueryHandlers = [GetIpBansHandler]

const CommandHandlers = [BanIpHandler, UnbanIpHandler]

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [IpBansController],
  providers: [
    IpBansService,
    { provide: IP_BAN_REPOSITORY, useClass: PrismaIpBanRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [IpBansService],
})
export class IpBansModule {}
