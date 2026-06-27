import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient } from '@prisma/client';

export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export const transactionStorage = new AsyncLocalStorage<PrismaTransactionClient>();

export function getTransactionClient(): PrismaTransactionClient | undefined {
  return transactionStorage.getStore();
}
