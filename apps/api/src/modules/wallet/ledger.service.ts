// Path: /apps/api/src/modules/wallet/ledger.service.ts
import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, LedgerEntryDirection, LedgerEntryType } from "@prisma/client";
import { WalletService } from "./wallet.service";

type PrismaLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService
  ) {}

  async addEntry(input: {
    userId: string;
    type: LedgerEntryType;
    direction: LedgerEntryDirection;
    amountMilliFec: number;
    idempotencyKey: string;
    reference?: string;
    metadata?: any;
    prisma?: PrismaLike;
  }) {
    const db = input.prisma ?? this.prisma;

    const wallet = await this.walletService.getOrCreateWallet(input.userId, db);

    // idempotency
    const existing = await db.ledgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey }
    });
    if (existing) {
      throw new ConflictException("Duplicate ledger entry.");
    }

    const newBalance =
      input.direction === "CREDIT"
        ? wallet.balanceMilliFec + input.amountMilliFec
        : wallet.balanceMilliFec - input.amountMilliFec;

    if (newBalance < 0) {
      // keep it generic; callers decide the message
      throw new ConflictException("Insufficient balance.");
    }

    const entry = await db.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: input.type,
        direction: input.direction,
        amountMilliFec: input.amountMilliFec,
        idempotencyKey: input.idempotencyKey,
        reference: input.reference,
        metadata: input.metadata
      }
    });

    await db.wallet.update({
      where: { id: wallet.id },
      data: { balanceMilliFec: newBalance }
    });

    return { entry, balanceMilliFec: newBalance };
  }
}
