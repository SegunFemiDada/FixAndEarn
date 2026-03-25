// Path: apps/api/src/modules/wallet/platform-wallet.service.ts
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

type PrismaLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class PlatformWalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreatePlatformWallet(prisma?: PrismaLike) {
    const db = prisma ?? this.prisma;

    let wallet = await db.platformWallet.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!wallet) {
      wallet = await db.platformWallet.create({
        data: {},
      });
    }

    return wallet;
  }

  async addEntry(input: {
    type: string;
    direction: "CREDIT" | "DEBIT";
    amountMilliFec: number;
    idempotencyKey: string;
    reference?: string;
    metadata?: Prisma.InputJsonValue;
    prisma?: PrismaLike;
  }) {
    const db = input.prisma ?? this.prisma;
    const wallet = await this.getOrCreatePlatformWallet(db);

    const existing = await db.platformLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    const nextBalance =
      input.direction === "CREDIT"
        ? wallet.balanceMilliFec + input.amountMilliFec
        : wallet.balanceMilliFec - input.amountMilliFec;

    if (nextBalance < 0) {
      throw new Error("PLATFORM_INSUFFICIENT_BALANCE");
    }

    const entry = await db.platformLedgerEntry.create({
      data: {
        platformWalletId: wallet.id,
        type: input.type,
        direction: input.direction,
        amountMilliFec: input.amountMilliFec,
        idempotencyKey: input.idempotencyKey,
        reference: input.reference,
        metadata: input.metadata,
      },
    });

    await db.platformWallet.update({
      where: { id: wallet.id },
      data: { balanceMilliFec: nextBalance },
    });

    return entry;
  }
}