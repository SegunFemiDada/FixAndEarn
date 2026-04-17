// Path: /apps/api/src/modules/wallet/wallet.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, WalletRole } from "@prisma/client";

type PrismaLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string, role: WalletRole, prisma?: PrismaLike) {
    const db = prisma ?? this.prisma;

    let wallet = await db.wallet.findUnique({
      where: {
        userId_role: {
          userId,
          role,
        },
      },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId,
          role,
        },
      });
    }

    return wallet;
  }

  async recalculateBalance(walletId: string): Promise<number> {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { walletId },
    });

    const balance = entries.reduce((acc, e) => {
      return e.direction === "CREDIT"
        ? acc + e.amountMilliFec
        : acc - e.amountMilliFec;
    }, 0);

    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { balanceMilliFec: balance },
    });

    return balance;
  }
}