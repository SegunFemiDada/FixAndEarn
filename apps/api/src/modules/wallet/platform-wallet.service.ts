// Path: /apps/api/src/modules/wallet/platform-wallet.service.ts
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
    if (input.amountMilliFec <= 0) {
      throw new Error("INVALID_PLATFORM_LEDGER_AMOUNT");
    }

    if (input.prisma) {
      return this.addEntryInTransaction(input, input.prisma);
    }

    return this.prisma.$transaction((tx) =>
      this.addEntryInTransaction(input, tx),
    );
  }

  private async addEntryInTransaction(
    input: {
      type: string;
      direction: "CREDIT" | "DEBIT";
      amountMilliFec: number;
      idempotencyKey: string;
      reference?: string;
      metadata?: Prisma.InputJsonValue;
      prisma?: PrismaLike;
    },
    db: Prisma.TransactionClient | PrismaService,
  ) {
    const wallet = await this.getOrCreatePlatformWallet(db);

    const existing = await db.platformLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    if (input.direction === "CREDIT") {
      const updatedWallet = await db.platformWallet.update({
        where: { id: wallet.id },
        data: {
          balanceMilliFec: {
            increment: input.amountMilliFec,
          },
        },
      });

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

      return {
        entry,
        balanceMilliFec: updatedWallet.balanceMilliFec,
      };
    }

    const updatedWallet = await db.platformWallet.updateMany({
      where: {
        id: wallet.id,
        balanceMilliFec: {
          gte: input.amountMilliFec,
        },
      },
      data: {
        balanceMilliFec: {
          decrement: input.amountMilliFec,
        },
      },
    });

    if (updatedWallet.count !== 1) {
      throw new Error("PLATFORM_INSUFFICIENT_BALANCE");
    }

    const walletAfterDebit = await db.platformWallet.findUnique({
      where: { id: wallet.id },
      select: { balanceMilliFec: true },
    });

    if (!walletAfterDebit) {
      throw new Error("PLATFORM_WALLET_BALANCE_COULD_NOT_BE_CONFIRMED");
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

    return {
      entry,
      balanceMilliFec: walletAfterDebit.balanceMilliFec,
    };
  }
}