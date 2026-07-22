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
          paystackTransferReference: reference,
          paystackTransferCode: transferCode,
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
              paystackTransferReference: reference,
              paystackTransferCode: transferCode,
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
            paystackTransferReference: reference,
            paystackTransferCode: transferCode,
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

const reference =
  event?.eventData?.paymentReference ??
  event?.eventData?.transactionReference ??
  event?.data?.reference ??
  event?.data?.transfer_reference ??
  null;
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
    // Process within a transaction, creating the webhook record atomically
const result = await this.prisma.$transaction(async (tx) => {
  const eventType =
    event?.eventType ??
    event?.event ??
    "UNKNOWN";

  await tx.webhookEvent.create({
    data: {
      reference,
      eventType,
    },
  });

  if (
    eventType === "charge.success" ||
    eventType === "SUCCESSFUL_TRANSACTION"
  ) {
    const deposit = await tx.deposit.findUnique({
      where: {
        reference,
      },
    });

    if (deposit) {
      if (deposit.status !== "SUCCEEDED") {
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
          amountMilliFec: deposit.amountMilliFec,
          idempotencyKey: `deposit:${reference}`,
          reference,
          prisma: tx,
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
      }

      return {
        ok: true,
        paymentType: "DEPOSIT",
      };
    }

    const paymentReference = reference;

const jobPayment = await tx.jobPayment.findUnique({
  where: {
    paystackReference: paymentReference,
  },
  include: {
    job: true,
  },
});

    if (!jobPayment) {
      return {
        ok: true,
      };
    }

    if (jobPayment.status !== "SUCCESS") {
      await tx.jobPayment.update({
        where: {
          id: jobPayment.id,
        },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
        },
      });

      switch (jobPayment.type) {
        case "POSTING":
          await tx.job.update({
            where: {
              id: jobPayment.jobId,
            },
            data: {
              status: "OPEN",
            },
          });
          break;

       case "URGENT": {
  const conversation = await tx.conversation.upsert({
    where: {
      jobId_fixerId: {
        jobId: jobPayment.jobId,
        fixerId: jobPayment.fixerId!,
      },
    },
    update: {
      status: "OPEN",
    },
    create: {
      jobId: jobPayment.jobId,
      fixerId: jobPayment.fixerId!,
      status: "OPEN",
    },
  });

  await tx.jobApplication.upsert({
    where: {
      jobId_fixerId: {
        jobId: jobPayment.jobId,
        fixerId: jobPayment.fixerId!,
      },
    },
    update: {
      status: "APPLIED",
    },
    create: {
      jobId: jobPayment.jobId,
      fixerId: jobPayment.fixerId!,
      status: "APPLIED",
    },
  });

  await tx.jobPayment.update({
    where: {
      id: jobPayment.id,
    },
    data: {
      conversationId: conversation.id,
    },
  });

  await tx.job.update({
    where: {
      id: jobPayment.jobId,
    },
    data: {
      status: "OPEN",
    },
  });

  try {
    await this.notifications.create({
      userId: jobPayment.fixerId!,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: "Urgent hire request",
      body: "A client has started an urgent hire with you. Open the conversation to continue.",
      idempotencyKey: `notif:urgent_hire:${jobPayment.jobId}:${jobPayment.fixerId}`,
      data: {
        jobId: jobPayment.jobId,
        conversationId: conversation.id,
      },
      prisma: tx,
    });
  } catch {}

  break;
}
        case "FINAL": {
  await tx.job.update({
    where: {
      id: jobPayment.jobId,
    },
    data: {
      fixerId: jobPayment.fixerId,
      lockedPriceMilliFec: jobPayment.lockedPriceMilliFec,
      status: "IN_PROGRESS",
    },
  });

  try {
    await this.notifications.create({
      userId: jobPayment.job.clientId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: "Payment received",
      body: "Your payment has been confirmed. The fixer can now begin working on your job.",
      idempotencyKey: `notif:job_started_client:${jobPayment.id}`,
      data: {
        jobId: jobPayment.jobId,
      },
      prisma: tx,
    });
  } catch {}

  if (jobPayment.fixerId) {
    try {
      await this.notifications.create({
        userId: jobPayment.fixerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Work can begin",
        body: "The client's payment has been confirmed. You may now begin working on the job.",
        idempotencyKey: `notif:job_started_fixer:${jobPayment.id}`,
        data: {
          jobId: jobPayment.jobId,
        },
        prisma: tx,
      });
    } catch {}
  }

  break;
}}
    }

    return {
      ok: true,
      paymentType: "JOB_PAYMENT",
      jobPaymentId: jobPayment.id,
    };
  }

  if (
    eventType === "transfer.success" ||
    eventType === "transfer.failed" ||
    eventType === "transfer.reversed"
  ) {
    return {
      ok: true,
      transferEvent: true,
    };
  }

  return {
    ok: true,
  };
});

if (
  result &&
  typeof result === "object" &&
  "transferEvent" in result
) {
  await this.handleTransferWebhook(event);
}

return result;
  }
}