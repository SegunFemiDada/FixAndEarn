// Path: /apps/api/src/modules/wallet/ledger.service.ts
import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import {
  Prisma,
  LedgerEntryDirection,
  LedgerEntryType,
  WalletRole,
} from "@prisma/client";
import { WalletService } from "./wallet.service";

type PrismaLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async addEntry(input: {
    userId: string;
    role: WalletRole;
    type: LedgerEntryType;
    direction: LedgerEntryDirection;
    amountMilliFec: number;
    idempotencyKey: string;
    reference?: string;
    metadata?: any;
    prisma?: PrismaLike;
  }) {
    if (input.amountMilliFec <= 0) {
      throw new ConflictException("Invalid ledger amount.");
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
      userId: string;
      role: WalletRole;
      type: LedgerEntryType;
      direction: LedgerEntryDirection;
      amountMilliFec: number;
      idempotencyKey: string;
      reference?: string;
      metadata?: any;
      prisma?: PrismaLike;
    },
    db: Prisma.TransactionClient | PrismaService,
  ) {
    const wallet = await this.walletService.getOrCreateWallet(
      input.userId,
      input.role,
      db,
    );

    const existing = await db.ledgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existing) {
      throw new ConflictException("Duplicate ledger entry.");
    }

    let balanceMilliFec: number;

    if (input.direction === LedgerEntryDirection.CREDIT) {
      const updatedWallet = await db.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceMilliFec: {
            increment: input.amountMilliFec,
          },
        },
      });

      balanceMilliFec = updatedWallet.balanceMilliFec;
    } else {
      const updatedWallet = await db.wallet.updateMany({
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
        throw new ConflictException("Insufficient balance.");
      }

      const walletAfterDebit = await db.wallet.findUnique({
        where: { id: wallet.id },
        select: { balanceMilliFec: true },
      });

      if (!walletAfterDebit) {
        throw new ConflictException("Wallet balance could not be confirmed.");
      }

      balanceMilliFec = walletAfterDebit.balanceMilliFec;
    }

    const entry = await db.ledgerEntry.create({
      data: {
        walletId: wallet.id,
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
      balanceMilliFec,
    };
  }
}