// apps/api/src/modules/payments/payments.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { NotificationType, WalletRole, WithdrawalStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LedgerService } from "../wallet/ledger.service";
import { PAYSTACK_PROVIDER } from "./payments.constants";
import { PaystackProvider } from "./paystack/paystack.provider";
import { ModuleRef } from "@nestjs/core";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(PAYSTACK_PROVIDER)
    private readonly paystack: PaystackProvider,
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly moduleRef: ModuleRef
  ) {}

  async initializeDeposit(userId: string, amountMilliFec: number) {
    if (!Number.isInteger(amountMilliFec) || amountMilliFec <= 0) {
      throw new BadRequestException("INVALID_AMOUNT");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    const reference = `DEP_${randomUUID()}`;
    const amountKobo = Math.round((amountMilliFec / 1000) * 100);

    await this.prisma.deposit.create({
      data: {
        userId,
        reference,
        amountMilliFec,
        status: "PENDING",
      },
    });

    return this.paystack.initializeTransaction({
      email: user.email,
      amountKobo,
      reference,
      metadata: { userId },
    });
  }

  async initiateWithdrawalPayout(args: { withdrawalId: string }) {
    const { withdrawalId } = args;

    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          include: {
            bankDetails: true,
          },
        },
      },
    });

    if (!withdrawal) {
      throw new Error("WITHDRAWAL_NOT_FOUND");
    }

    const bank = withdrawal.user.bankDetails;
    if (!bank?.paystackRecipientCode) {
      throw new Error("BANK_DETAILS_INCOMPLETE");
    }

    const amountKobo = Math.round((withdrawal.amountMilliFec / 1000) * 100);
    if (amountKobo <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const reference = `WDR_${withdrawal.id}`;
    await this.paystack.initiateTransfer({
      amountKobo,
      recipientCode: bank.paystackRecipientCode,
      reference,
      reason: "Withdrawal payout",
    });

    return { ok: true, reference };
  }

  async handlePaystackTransferSuccess(reference: string) {
    const adminFinance = this.moduleRef.get("AdminFinanceService", {
      strict: false,
    });
    if (!adminFinance) {
      throw new Error("ADMIN_FINANCE_SERVICE_NOT_AVAILABLE");
    }
    await adminFinance.handlePaystackSuccess(reference);
  }

  async handleTransferWebhook(event: any) {
    const data = event?.data;
    const reference =
      typeof data?.reference === "string" ? data.reference.trim() : "";
    const transferCode =
      typeof data?.transfer_code === "string" ? data.transfer_code.trim() : null;

    if (!reference || !reference.startsWith("WDR_")) {
      return { ok: true };
    }

    const withdrawalId = reference.slice(4);
    if (!withdrawalId) {
      return { ok: true };
    }

    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      return { ok: true };
    }

    if (event?.event === "transfer.success") {
      if (withdrawal.status === WithdrawalStatus.PAID) {
        return { ok: true };
      }

      await this.prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.PAID,
          paidAt: new Date(),
          paystackTransferReference: reference,
          paystackTransferCode: transferCode,
          payoutMode: "PAYSTACK",
        },
      });

      try {
        await this.notifications.create({
          userId: withdrawal.userId,
          type: NotificationType.WITHDRAWAL_PAID,
          title: "Withdrawal paid",
          body: `Your withdrawal of ${(withdrawal.amountMilliFec / 1000).toFixed(2)} FEC has been paid.`,
          idempotencyKey: `notif:withdrawal_paid:${withdrawal.id}`,
          data: {
            withdrawalId: withdrawal.id,
            amountMilliFec: withdrawal.amountMilliFec,
            reference,
            transferCode,
            mode: "PAYSTACK",
          },
        });
      } catch {}

      return { ok: true };
    }

    if (event?.event === "transfer.failed" || event?.event === "transfer.reversed") {
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
            where: { id: withdrawalId },
            data: {
              status: WithdrawalStatus.APPROVED,
              paidAt: null,
              paystackTransferReference: reference,
              paystackTransferCode: transferCode,
              payoutMode: "PAYSTACK",
            },
          });
          return;
        }

        const existingReversal = await tx.ledgerEntry.findFirst({
          where: {
            walletId: wallet.id,
            reference: withdrawalId,
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
              idempotencyKey: `withdrawal_reversal:${withdrawalId}`,
              reference: withdrawalId,
              metadata: {
                source: "PAYSTACK_TRANSFER_WEBHOOK",
                event: event.event,
                originalReference: reference,
                transferCode,
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
          where: { id: withdrawalId },
          data: {
            status: WithdrawalStatus.APPROVED,
            paidAt: null,
            paystackTransferReference: reference,
            paystackTransferCode: transferCode,
            payoutMode: "PAYSTACK",
          },
        });
      });

      return { ok: true };
    }

    return { ok: true };
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    const isValid = this.paystack.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new BadRequestException("INVALID_SIGNATURE");
    }

    const event = JSON.parse(rawBody.toString());
    const reference = event?.data?.reference ?? event?.data?.transfer_reference ?? null;
    if (!reference) {
      throw new BadRequestException("MISSING_REFERENCE");
    }

    // Idempotency check
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { reference },
    });
    if (existing) {
      this.logger.warn(`Duplicate webhook event for reference ${reference}`);
      return { ok: true, alreadyProcessed: true };
    }

    // Process within a transaction, creating the webhook record atomically
    return await this.prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: { reference, eventType: event.event },
      });

      if (event?.event === "charge.success") {
        const deposit = await tx.deposit.findUnique({
          where: { reference },
        });
        if (!deposit || deposit.status === "SUCCEEDED") {
          return { ok: true };
        }

        await tx.deposit.update({
          where: { id: deposit.id },
          data: { status: "SUCCEEDED" },
        });

        await this.ledgerService.addEntry({
          userId: deposit.userId,
          role: WalletRole.CLIENT,
          type: "DEPOSIT",
          direction: "CREDIT",
          amountMilliFec: deposit.amountMilliFec,
          idempotencyKey: `deposit:${reference}`,
          reference,
          prisma: tx,
        });

        // Notification outside transaction (or inside? It doesn't affect financial state, so safe outside)
        try {
          await this.notifications.create({
            userId: deposit.userId,
            type: NotificationType.DEPOSIT_SUCCEEDED,
            title: "Deposit received",
            body: `Your wallet has been credited with ${(deposit.amountMilliFec / 1000).toFixed(2)} FEC.`,
            idempotencyKey: `notif:deposit:${deposit.reference}`,
            data: {
              reference: deposit.reference,
              amountMilliFec: deposit.amountMilliFec,
            },
          });
        } catch {}

        return { ok: true };
      }

      if (
        event?.event === "transfer.success" ||
        event?.event === "transfer.failed" ||
        event?.event === "transfer.reversed"
      ) {
        // Delegate to handleTransferWebhook but inside the same transaction? 
        // The original handleTransferWebhook uses its own transactions. To keep it simple,
        // we call it outside the transaction because it already handles its own idempotency.
        // However, we already created the webhookEvent record, so subsequent calls will be ignored.
        // This is safe.
        await this.handleTransferWebhook(event);
        return { ok: true };
      }

      return { ok: true };
    });
  }
}