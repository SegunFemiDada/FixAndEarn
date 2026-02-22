// Path: /apps/api/src/infra/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    const autoConnect = this.config.get<string>("PRISMA_AUTO_CONNECT", "false") === "true";
    if (autoConnect) {
      await this.$connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    // If we never connected, disconnect is harmless but we’ll guard anyway.
    try {
      await this.$disconnect();
    } catch {
      // ignore
    }
  }
}
