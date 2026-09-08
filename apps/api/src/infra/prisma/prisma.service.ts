// Path: /apps/api/src/infra/prisma/prisma.service.ts

import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly config: ConfigService) {
    const maxWait = Number(process.env.PRISMA_TRANSACTION_MAX_WAIT_MS);
    const timeout = Number(process.env.PRISMA_TRANSACTION_TIMEOUT_MS);

    const transactionOptions =
      Number.isFinite(maxWait) && maxWait > 0
        ? {
            maxWait,
            ...(Number.isFinite(timeout) && timeout > 0
              ? { timeout }
              : {}),
          }
        : undefined;

    super(
      transactionOptions
        ? {
            transactionOptions,
          }
        : undefined,
    );
  }

  async onModuleInit(): Promise<void> {
    const autoConnect =
      this.config.get<string>("PRISMA_AUTO_CONNECT", "false") === "true";

    if (autoConnect) {
      await this.$connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
    } catch {
      // ignore
    }
  }
}