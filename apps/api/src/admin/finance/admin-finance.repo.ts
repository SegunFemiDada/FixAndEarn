// Path: apps/api/src/admin/finance/admin-finance.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, WalletRole } from "@prisma/client";

@Injectable()
export class AdminFinanceRepo {
  constructor(private readonly prisma: PrismaService) {}

  listWithdrawals(status: any, skip: number, take: number) {
    return this.prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "asc" },
      skip,
      take,
      include: {
        user: { select: { id: true, email: true, fullName: true, isActive: true } },
      },
    });
  }

  async getWithdrawal(id: string) {
    const row = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            bankDetails: true,
          },
        },
      },
    });

    if (!row) return null;

    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_role: {
          userId: row.userId,
          role: WalletRole.FIXER,
        },
      },
      select: {
        id: true,
        role: true,
        balanceMilliFec: true,
      },
    });

    return {
      ...row,
      user: {
        ...row.user,
        wallet,
      },
    };
  }

  private async hasWithdrawalDebit(
    tx: Prisma.TransactionClient,
    walletId: string,
    withdrawalId: string
  ) {
    const debit = await tx.ledgerEntry.findFirst({
      where: {
        walletId,
        reference: withdrawalId,
        direction: "DEBIT",
        type: { in: ["WITHDRAWAL_REQUEST", "WITHDRAWAL_APPROVED"] },
      },
      select: { id: true, type: true },
    });

    return debit;
  }

  private async hasWithdrawalReversal(
    tx: Prisma.TransactionClient,
    walletId: string,
    withdrawalId: string
  ) {
    const credit = await tx.ledgerEntry.findFirst({
      where: {
        walletId,
        reference: withdrawalId,
        direction: "CREDIT",
        type: { in: ["WITHDRAWAL_REJECTED"] },
      },
      select: { id: true },
    });

    return credit;
  }

  async approveWithdrawal(args: { withdrawalId: string; adminId: string; note?: string | null }) {
    const { withdrawalId, adminId, note } = args;

    return this.prisma.$transaction(async (tx) => {
      const wr = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
      if (!wr) throw new Error("WITHDRAWAL_NOT_FOUND");

      if (wr.status === "APPROVED" || wr.status === "PAID") {
        return { ok: true, status: wr.status };
      }
      if (wr.status !== "PENDING") throw new Error("WITHDRAWAL_NOT_PENDING");

      const wallet = await tx.wallet.findUnique({
        where: {
          userId_role: {
            userId: wr.userId,
            role: WalletRole.FIXER,
          },
        },
      });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      const existingDebit = await this.hasWithdrawalDebit(tx, wallet.id, withdrawalId);

      if (!existingDebit) {
        if (wallet.balanceMilliFec < wr.amountMilliFec) throw new Error("INSUFFICIENT_BALANCE");

        const idempotencyKey = `withdrawal_approve:${withdrawalId}`;

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL_APPROVED",
            direction: "DEBIT",
            amountMilliFec: wr.amountMilliFec,
            idempotencyKey,
            reference: withdrawalId,
            metadata: { withdrawalId },
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceMilliFec: { decrement: wr.amountMilliFec } },
        });
      }

      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "APPROVED",
          reviewedBy: adminId,
          reviewNote: note ?? null,
          reviewedAt: new Date(),
        },
      });

      return { ok: true, status: "APPROVED" as const };
    });
  }

  async rejectWithdrawal(args: { withdrawalId: string; adminId: string; note?: string | null }) {
    const { withdrawalId, adminId, note } = args;

    return this.prisma.$transaction(async (tx) => {
      const wr = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
      if (!wr) throw new Error("WITHDRAWAL_NOT_FOUND");

      if (wr.status === "REJECTED") return { ok: true, status: "REJECTED" as const };
      if (wr.status === "PAID") return { ok: true, status: "PAID" as const };
      if (wr.status !== "PENDING") throw new Error("WITHDRAWAL_NOT_PENDING");

      const wallet = await tx.wallet.findUnique({
        where: {
          userId_role: {
            userId: wr.userId,
            role: WalletRole.FIXER,
          },
        },
      });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      const existingDebit = await this.hasWithdrawalDebit(tx, wallet.id, withdrawalId);
      const existingReversal = await this.hasWithdrawalReversal(tx, wallet.id, withdrawalId);

      if (existingDebit && !existingReversal) {
        const idempotencyKey = `withdrawal_reject_refund:${withdrawalId}`;

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL_REJECTED",
            direction: "CREDIT",
            amountMilliFec: wr.amountMilliFec,
            idempotencyKey,
            reference: withdrawalId,
            metadata: { withdrawalId, reason: note ?? null },
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceMilliFec: { increment: wr.amountMilliFec } },
        });
      }

      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          reviewedBy: adminId,
          reviewNote: note ?? null,
          reviewedAt: new Date(),
        },
      });

      return { ok: true, status: "REJECTED" as const };
    });
  }

  async markPaid(args: { withdrawalId: string; adminId: string; note?: string | null }) {
    const { withdrawalId, adminId, note } = args;

    return this.prisma.$transaction(async (tx) => {
      const wr = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
      if (!wr) throw new Error("WITHDRAWAL_NOT_FOUND");

      if (wr.status === "PAID") return { ok: true, status: "PAID" as const };
      if (wr.status !== "APPROVED") throw new Error("WITHDRAWAL_NOT_APPROVED");

      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          reviewedBy: adminId,
          reviewNote: note ?? wr.reviewNote ?? null,
          paidAt: new Date(),
        },
      });

      return { ok: true, status: "PAID" as const };
    });
  }
}