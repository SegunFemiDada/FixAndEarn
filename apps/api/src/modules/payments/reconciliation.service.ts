//path: apps/api/src/modules/payments/reconciliation.service.ts
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WalletRole, WithdrawalStatus } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PAYMENT_PROVIDER } from "./payments.constants";

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: any
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cronRun() {
    await this.run();
  }

  async run() {
    this.logger.log("Starting reconciliation job...");

    const withdrawals = await this.prisma.withdrawalRequest.findMany({
      where: {
        status: WithdrawalStatus.PAID,
        payoutMode: "PAYSTACK",
        paystackTransferReference: {
          not: null,
        },
      },
      select: {
        id: true,
        userId: true,
        amountMilliFec: true,
        status: true,
        paystackTransferReference: true,
      },
    });

    for (const withdrawal of withdrawals) {
      try {
        const reference = withdrawal.paystackTransferReference;
        if (!reference) {
          continue;
        }

        const transfer = await this.paymentProvider.fetchTransfer(reference);
        const status = String(transfer?.status ?? "").toLowerCase();

        if (status === "failed" || status === "reversed") {
          this.logger.warn(
            `Mismatch detected for withdrawal ${withdrawal.id}. Paystack status=${status}. Reverting payout state.`
          );

          await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
              where: {
                userId_role: {
                  userId: withdrawal.userId,
                  role: WalletRole.FIXER,
                },
              },
            });

            if (!wallet) {
              await tx.withdrawalRequest.update({
                where: { id: withdrawal.id },
                data: {
                  status: WithdrawalStatus.APPROVED,
                  paidAt: null,
                },
              });
              return;
            }

            const existingReversal = await tx.ledgerEntry.findFirst({
              where: {
                walletId: wallet.id,
                reference: withdrawal.id,
                type: "WITHDRAWAL_REVERSAL",
                direction: "CREDIT",
              },
              select: { id: true },
            });

            if (!existingReversal) {
              await tx.ledgerEntry.create({
                data: {
                  walletId: wallet.id,
                  type: "WITHDRAWAL_REVERSAL",
                  direction: "CREDIT",
                  amountMilliFec: withdrawal.amountMilliFec,
                  idempotencyKey: `recon_reversal:${withdrawal.id}`,
                  reference: withdrawal.id,
                  metadata: {
                    source: "RECONCILIATION_JOB",
                    paystackTransferReference: reference,
                    paystackTransferCode: transfer.transferCode ?? null,
                    paystackStatus: transfer.status,
                  },
                },
              });

              await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                  balanceMilliFec: {
                    increment: withdrawal.amountMilliFec,
                  },
                },
              });
            }

            await tx.withdrawalRequest.update({
              where: { id: withdrawal.id },
              data: {
                status: WithdrawalStatus.APPROVED,
                paidAt: null,
                paystackTransferCode: transfer.transferCode ?? null,
              },
            });
          });
        }
      } catch (error: any) {
        this.logger.error(
          `Reconciliation failed for withdrawal ${withdrawal.id}: ${String(
            error?.message ?? error
          )}`
        );
      }
    }

    this.logger.log("Reconciliation job completed.");
  }
}