import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { NotificationType, WalletRole, WithdrawalStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LedgerService } from "../wallet/ledger.service";
import { PAYSTACK_PROVIDER } from "./payments.constants";
import { PaystackProvider } from "./paystack/paystack.provider";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYSTACK_PROVIDER)
    private readonly paystack: PaystackProvider,
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly notifications: NotificationsService
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

    if (event?.event === "charge.success") {
      const reference =
        typeof event?.data?.reference === "string"
          ? event.data.reference.trim()
          : "";

      if (!reference) {
        throw new BadRequestException("INVALID_EVENT_REFERENCE");
      }

      const deposit = await this.prisma.deposit.findUnique({
        where: { reference },
      });

      if (!deposit || deposit.status === "SUCCEEDED") {
        return { ok: true };
      }

      await this.prisma.$transaction(async (tx) => {
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
      });

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
      return this.handleTransferWebhook(event);
    }

    return { ok: true };
  }
}