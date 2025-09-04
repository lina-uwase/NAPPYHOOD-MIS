import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    // no-op stub
  }

  async onModuleDestroy(): Promise<void> {
    // no-op stub
  }

  // minimal stubbed methods used by AuthService
  user = {
    findUnique: async (_args: any) => null,
    findFirst: async (_args: any) => null,
  } as any;

  account = {
    findFirst: async (_args: any) => null,
    findUnique: async (_args: any) => null,
    update: async (_args: any) => null,
  } as any;

  recoveryCode = {
    createMany: async (_args: any) => null,
    update: async (_args: any) => null,
    deleteMany: async (_args: any) => null,
  } as any;

  $transaction = async (fn: (tx: any) => Promise<any>) => {
    return fn({ account: this.account, recoveryCode: this.recoveryCode });
  };
}


