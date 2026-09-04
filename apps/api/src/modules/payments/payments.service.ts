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
import { PAYMENT_PROVIDER } from "./payments.constants";
import { PaymentProvider } from "./payment.provider";
import { ModuleRef } from "@nestjs/core";
import { JobPaymentProcessorService } from "../job-payments/job-payment-processor.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly moduleRef: ModuleRef,
    private readonly jobPaymentProcessor: JobPaymentProcessorService,
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

    return this.paymentProvider.initializeTransaction({
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

if (
  !bank ||
  !bank.accountNumber ||
  !bank.bankCode ||
  !bank.accountName
) {
  throw new Error(
    "BANK_DETAILS_INCOMPLETE",
  );
}

    const amountKobo = Math.round((withdrawal.amountMilliFec / 1000) * 100);
    if (amountKobo <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const reference = `WDR_${withdrawal.id}`;
    await this.paymentProvider.initiateTransfer({
  amountKobo,
  accountNumber: bank.accountNumber,
  bankCode: bank.bankCode,
  accountName: bank.accountName,
  reference,
  reason: "Withdrawal payout",
});

    return { ok: true, reference };
  }

  async handleTransferSuccess(reference: string) {
  const adminFinance = this.moduleRef.get("AdminFinanceService", {
    strict: false,
  });

  if (!adminFinance) {
    throw new Error("ADMIN_FINANCE_SERVICE_NOT_AVAILABLE");
  }

  await adminFinance.handleTransferSuccess(reference);
}

  async handleTransferWebhook(event: any) {
    const data = event?.data;
    const reference =
      typeof data?.reference === "string" ? data.reference.trim() : "";
    const transferCode =
  typeof data?.transfer_code === "string"
    ? data.transfer_code.trim()
    : typeof data?.transferCode === "string"
      ? data.transferCode.trim()
      : null;
      
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
          transferReference: reference,
          transferCode: transferCode,
          payoutMode: "BANK_TRANSFER",
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
            mode: "BANK_TRANSFER",
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
              transferReference: reference,
              transferCode: transferCode,
              payoutMode: "BANK_TRANSFER",
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
                source: "PAYMENT_TRANSFER_WEBHOOK",
                event: event.event,
                paymentReference: reference,
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
            transferReference: reference,
            transferCode: transferCode,
            payoutMode: "BANK_TRANSFER",
          },
        });
      });

      return { ok: true };
    }

    return { ok: true };
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
  const isValid =
    this.paymentProvider.verifyWebhookSignature(
      rawBody,
      signature,
    );

  if (!isValid) {
    throw new BadRequestException(
      "INVALID_SIGNATURE",
    );
  }

  const event = JSON.parse(
    rawBody.toString(),
  );

  const eventType =
    event?.eventType ??
    event?.event ??
    "UNKNOWN";

  if (eventType !== "SUCCESSFUL_TRANSACTION") {
    return {
      ok: true,
      ignored: true,
      eventType,
    };
  }

  const eventData = event?.eventData;

  const reference =
    typeof eventData?.paymentReference === "string"
      ? eventData.paymentReference.trim()
      : "";

  if (!reference) {
    throw new BadRequestException(
      "MISSING_PAYMENT_REFERENCE",
    );
  }

  const paymentStatus =
    typeof eventData?.paymentStatus === "string"
      ? eventData.paymentStatus.trim().toUpperCase()
      : "";

  if (paymentStatus !== "PAID") {
    this.logger.warn(
      `Monnify webhook ${reference} is not PAID. Status: ${paymentStatus || "UNKNOWN"}`,
    );

    return {
      ok: true,
      paymentVerified: false,
      paymentStatus: paymentStatus || null,
    };
  }

  const currency =
    typeof eventData?.currency === "string"
      ? eventData.currency.trim().toUpperCase()
      : "";

  if (currency !== "NGN") {
    throw new BadRequestException(
      "INVALID_PAYMENT_CURRENCY",
    );
  }

  const amountPaid = Number(
    eventData?.amountPaid,
  );

  if (
    !Number.isFinite(amountPaid) ||
    amountPaid <= 0
  ) {
    throw new BadRequestException(
      "INVALID_PAYMENT_AMOUNT",
    );
  }

  /*
   * First check whether this is a wallet deposit.
   */
  const deposit =
    await this.prisma.deposit.findUnique({
      where: {
        reference,
      },
      select: {
        id: true,
        userId: true,
        amountMilliFec: true,
        status: true,
        reference: true,
      },
    });

  if (deposit) {
    const expectedDepositAmount =
      deposit.amountMilliFec / 1000;

    if (
      amountPaid !== expectedDepositAmount
    ) {
      this.logger.error(
        `Monnify amount mismatch for deposit ${reference}. Expected ${expectedDepositAmount} NGN, received ${amountPaid} NGN.`,
      );

      throw new BadRequestException(
        "PAYMENT_AMOUNT_MISMATCH",
      );
    }

    const existingWebhook =
      await this.prisma.webhookEvent.findUnique({
        where: {
          reference,
        },
      });

    if (existingWebhook) {
      return {
        ok: true,
        alreadyProcessed: true,
        paymentType: "DEPOSIT",
      };
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.webhookEvent.create({
          data: {
            reference,
            eventType,
          },
        });

        const currentDeposit =
          await tx.deposit.findUnique({
            where: {
              id: deposit.id,
            },
          });

        if (
          !currentDeposit ||
          currentDeposit.status === "SUCCEEDED"
        ) {
          return;
        }

        await tx.deposit.update({
          where: {
            id: deposit.id,
          },
          data: {
            status: "SUCCEEDED",
          },
        });

        await this.ledgerService.addEntry({
          userId: deposit.userId,
          role: WalletRole.CLIENT,
          type: "DEPOSIT",
          direction: "CREDIT",
          amountMilliFec:
            deposit.amountMilliFec,
          idempotencyKey:
            `deposit:${reference}`,
          reference,
          prisma: tx,
        });
      },
    );

    try {
      await this.notifications.create({
        userId: deposit.userId,
        type: NotificationType.DEPOSIT_SUCCEEDED,
        title: "Deposit received",
        body: `Your wallet has been credited with ${(deposit.amountMilliFec / 1000).toFixed(2)} FEC.`,
        idempotencyKey:
          `notif:deposit:${deposit.reference}`,
        data: {
          reference: deposit.reference,
          amountMilliFec:
            deposit.amountMilliFec,
        },
      });
    } catch {}

    return {
      ok: true,
      paymentType: "DEPOSIT",
    };
  }

  /*
   * Otherwise this must be a JobPayment.
   */
  const jobPayment =
    await this.prisma.jobPayment.findUnique({
      where: {
        paymentReference: reference,
      },
      select: {
        id: true,
        jobId: true,
        type: true,
        status: true,
        amountMilliFec: true,
        paymentReference: true,
        job: {
          select: {
            clientId: true,
          },
        },
      },
    });

  if (!jobPayment) {
    this.logger.warn(
      `Received Monnify webhook for unknown payment reference ${reference}`,
    );

    return {
      ok: true,
      ignored: true,
      reason: "PAYMENT_NOT_FOUND",
    };
  }

  if (
    amountPaid !==
    jobPayment.amountMilliFec
  ) {
    this.logger.error(
      `Monnify amount mismatch for job payment ${reference}. Expected ${jobPayment.amountMilliFec} NGN, received ${amountPaid} NGN.`,
    );

    throw new BadRequestException(
      "PAYMENT_AMOUNT_MISMATCH",
    );
  }

  const existingWebhook =
  await this.prisma.webhookEvent.findUnique({
    where: {
      reference,
    },
  });

if (existingWebhook) {
  return {
    ok: true,
    alreadyProcessed: true,
    paymentType: "JOB_PAYMENT",
  };
}

const processorResult =
  await this.jobPaymentProcessor.handleSuccessfulPayment(
    jobPayment.id,
  );

try {
  await this.prisma.webhookEvent.create({
    data: {
      reference,
      eventType,
    },
  });
} catch (error: any) {
  /*
   * A concurrent webhook may have created the record
   * after our initial duplicate check.
   *
   * The payment processor itself is already concurrency-safe,
   * so a duplicate webhook record is not required for payment
   * correctness.
   */
  if (error?.code !== "P2002") {
    throw error;
  }
}

return {
  ok: true,
  paymentType: "JOB_PAYMENT",
  jobPaymentId: jobPayment.id,
  processorResult,
};
}
}