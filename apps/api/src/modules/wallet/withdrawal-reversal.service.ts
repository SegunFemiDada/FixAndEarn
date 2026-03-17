// Path: apps/api/src/modules/wallet/withdrawal-reversal.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { LedgerService } from "./ledger.service";
import { WalletRole } from "@prisma/client";

@Injectable()
export class WithdrawalReversalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService
  ) {}

  async refund(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) return;

    const idempotencyKey = `withdrawal_reversal:${withdrawal.id}`;

    // Check if reversal already exists
    const existing = await this.prisma.ledgerEntry.findUnique({
      where: { idempotencyKey },
    });

    if (existing) return;

    await this.ledgerService.addEntry({
  userId: withdrawal.userId,
  role: WalletRole.FIXER,
  type: "WITHDRAWAL_REVERSAL",
  direction: "CREDIT",
  amountMilliFec: withdrawal.amountMilliFec,
  idempotencyKey: `withdrawal_reversal:${withdrawal.id}`,
  reference: `REV_${withdrawal.id}`,
});
  }
}