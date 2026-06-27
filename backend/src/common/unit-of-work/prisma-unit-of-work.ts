import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IUnitOfWork } from './unit-of-work.interface';
import { transactionStorage } from './prisma-transaction.context';

@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => transactionStorage.run(tx, work));
  }
}
