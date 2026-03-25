import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { NotificationType, WithdrawalStatus } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../../modules/notifications/notifications.service";
import { PAYSTACK_PROVIDER } from "../../modules/payments/payments.constants";
import { PaystackProvider } from "../../modules/payments/paystack/paystack.provider";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminFinanceRepo } from "./admin-finance.repo";

@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly repo: AdminFinanceRepo,
    private readonly audit: AdminAuditService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    @Inject(PAYSTACK_PROVIDER) private readonly paystack: PaystackProvider
  ) {}

  async list(q: { status?: string; skip?: number; take?: number }) {
    return this.repo.listWithdrawals(q.status, q.skip ?? 0, q.take ?? 50);
  }

  async getOne(id: string) {
    const rec = await this.repo.getWithdrawal(id);
    if (!rec) throw new NotFoundException("WITHDRAWAL_NOT_FOUND");
    return rec;
  }

  async getEarningsTrace(id: string) {
    const rec = await this.repo.getWithdrawalEarningsTrace(id);
    if (!rec) throw new NotFoundException("WITHDRAWAL_NOT_FOUND");
    return rec;
  }

  async approve(args: { withdrawalId: string; adminId: string; note?: string }) {
    try {
      const note = args.note?.trim() || null;

      const res = await this.repo.approveWithdrawal({
        withdrawalId: args.withdrawalId,
        adminId: args.adminId,
        note,
      });

      await this.audit.log({
        actorAdminId: args.adminId,
        action: "WITHDRAWAL_APPROVE",
        description: "Approved withdrawal",
        metadata: { withdrawalId: args.withdrawalId, note },
      });

      try {
        const withdrawal = await this.repo.getWithdrawal(args.withdrawalId);

        if (withdrawal?.userId) {
          await this.notifications.create({
            userId: withdrawal.userId,
            type: NotificationType.WITHDRAWAL_APPROVED,
            title: "Withdrawal approved",
            body: `Your withdrawal of ${(withdrawal.amountMilliFec / 1000).toFixed(2)} FEC was approved.`,
            idempotencyKey: `notif:withdrawal_approved:${withdrawal.id}`,
            data: { withdrawalId: withdrawal.id },
          });
        }
      } catch {}

      return res;
    } catch (e: any) {
      const msg = String(e?.message ?? "");

      if (msg === "WITHDRAWAL_NOT_FOUND") throw new NotFoundException(msg);
      if (msg === "WITHDRAWAL_NOT_PENDING") throw new ForbiddenException(msg);
      if (msg === "INSUFFICIENT_BALANCE") throw new BadRequestException(msg);

      throw e;
    }
  }

  async reject(args: { withdrawalId: string; adminId: string; note?: string }) {
    const note = args.note?.trim();
    if (!note) throw new BadRequestException("NOTE_REQUIRED");

    try {
      const res = await this.repo.rejectWithdrawal({
        withdrawalId: args.withdrawalId,
        adminId: args.adminId,
        note,
      });

      await this.audit.log({
        actorAdminId: args.adminId,
        action: "WITHDRAWAL_REJECT",
        description: "Rejected withdrawal",
        metadata: { withdrawalId: args.withdrawalId, note },
      });

      try {
        const withdrawal = await this.repo.getWithdrawal(args.withdrawalId);

        if (withdrawal?.userId) {
          await this.notifications.create({
            userId: withdrawal.userId,
            type: NotificationType.WITHDRAWAL_REJECTED,
            title: "Withdrawal rejected",
            body: `Reason: ${note}`,
            idempotencyKey: `notif:withdrawal_rejected:${withdrawal.id}`,
          });
        }
      } catch {}

      return res;
    } catch (e: any) {
      const msg = String(e?.message ?? "");

      if (msg === "WITHDRAWAL_NOT_FOUND") throw new NotFoundException(msg);
      if (msg === "WITHDRAWAL_NOT_PENDING") throw new ForbiddenException(msg);

      throw e;
    }
  }

  async markPaid(args: { withdrawalId: string; adminId: string; note?: string }) {
    const wr = await this.prisma.withdrawalRequest.findUnique({
      where: { id: args.withdrawalId },
      include: { user: { include: { bankDetails: true } } },
    });

    if (!wr) throw new NotFoundException("WITHDRAWAL_NOT_FOUND");
    if (wr.status !== WithdrawalStatus.APPROVED)
      throw new ForbiddenException("WITHDRAWAL_NOT_APPROVED");

    const note = args.note?.trim() || wr.reviewNote || null;

    const payoutsEnabled = process.env.PAYSTACK_PAYOUTS_ENABLED === "true";
    const reference = `WDR_${wr.id}`;

    if (payoutsEnabled) {
      const bank = wr.user.bankDetails;

      if (!bank?.paystackRecipientCode) {
        throw new BadRequestException("BANK_DETAILS_INCOMPLETE");
      }

      const amountKobo = Math.round((wr.amountMilliFec / 1000) * 100);
      if (amountKobo <= 0) throw new BadRequestException("INVALID_AMOUNT");

      try {
        await this.paystack.initiateTransfer({
          recipientCode: bank.paystackRecipientCode,
          amountKobo,
          reference,
          reason: "FixAndEarn withdrawal",
        });
      } catch (err: any) {
        const message = String(err?.message ?? "PAYSTACK_FAILED");

        await this.audit.log({
          actorAdminId: args.adminId,
          action: "WITHDRAWAL_PAID_FAILED",
          description: message,
          metadata: { withdrawalId: wr.id, reference },
        });

        throw new BadRequestException(message);
      }
    }

    const updated = await this.prisma.withdrawalRequest.update({
      where: { id: wr.id },
      data: {
        status: WithdrawalStatus.PAID,
        payoutMode: payoutsEnabled ? "PAYSTACK" : "MANUAL",
        paidAt: new Date(),
        reviewedBy: args.adminId,
        reviewNote: note,
        reviewedAt: new Date(),
      },
    });

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "WITHDRAWAL_PAID",
      description: payoutsEnabled ? "Paystack payout" : "Manual payout",
      metadata: { withdrawalId: wr.id, reference },
    });

    try {
      await this.notifications.create({
        userId: wr.userId,
        type: NotificationType.WITHDRAWAL_PAID,
        title: "Withdrawal paid",
        body: `Amount: ${(wr.amountMilliFec / 1000).toFixed(2)} FEC`,
        idempotencyKey: `notif:withdrawal_paid:${wr.id}`,
      });
    } catch {}

    return {
      ok: true,
      withdrawalId: updated.id,
      status: updated.status,
      payoutMode: updated.payoutMode,
      paidAt: updated.paidAt,
    };
  }
}