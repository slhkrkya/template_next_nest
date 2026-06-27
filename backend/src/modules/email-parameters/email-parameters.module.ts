import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { EmailParametersService } from './email-parameters.service'
import { EmailParametersController } from './email-parameters.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { EMAIL_PARAMETERS_REPOSITORY } from './domain/email-parameters.repository.interface'
import { PrismaEmailParametersRepository } from './infrastructure/prisma-email-parameters.repository'
import { GetEmailParametersHandler } from './queries/handlers'
import { UpsertEmailParametersHandler, RemoveEmailParametersHandler } from './commands/handlers'

const QueryHandlers = [GetEmailParametersHandler]

const CommandHandlers = [UpsertEmailParametersHandler, RemoveEmailParametersHandler]

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [EmailParametersController],
  providers: [
    EmailParametersService,
    { provide: EMAIL_PARAMETERS_REPOSITORY, useClass: PrismaEmailParametersRepository },
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [EmailParametersService],
})
export class EmailParametersModule {}
