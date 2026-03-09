import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminFinanceRepo } from "./admin-finance.repo";
import { NotificationsService } from "../../modules/notifications/notifications.service";


@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly repo: AdminFinanceRepo,
    private readonly audit: AdminAuditService,
    private readonly notifications: NotificationsService
  ) {}

  async list(q: { status?: any; skip?: number; take?: number }) {
    return this.repo.listWithdrawals(q.status, q.skip ?? 0, q.take ?? 50);
  }

  async getOne(id: string) {
    const rec = await this.repo.getWithdrawal(id);
    if (!rec) throw new NotFoundException("WITHDRAWAL_NOT_FOUND");
    return rec;
  }

  async approve(args: { withdrawalId: string; adminId: string; note?: string }) {
    try {
      const res = await this.repo.approveWithdrawal({
        withdrawalId: args.withdrawalId,
        adminId: args.adminId,
        note: args.note?.trim()
      });

      await this.audit.log({
        actorAdminId: args.adminId,
        action: "WITHDRAWAL_APPROVE",
        description: "Approved withdrawal",
        metadata: { withdrawalId: args.withdrawalId, status: res.status }
      });

      try {
        const withdrawal = await this.repo.getWithdrawal(args.withdrawalId);
        if (withdrawal?.userId) {
          await this.notifications.create({
            userId: withdrawal.userId,
            type: NotificationType.WITHDRAWAL_APPROVED,
            title: "Withdrawal approved",
            body: `Your withdrawal request for ${(withdrawal.amountMilliFec / 1000).toFixed(2)} FEC was approved.`,
            idempotencyKey: `notif:withdrawal_approved:${args.withdrawalId}`,
            data: {
              withdrawalId: args.withdrawalId,
              amountMilliFec: withdrawal.amountMilliFec,
              note: args.note?.trim() ?? null,
            },
          });
        }
      } catch {}

      return res;
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg === "WITHDRAWAL_NOT_FOUND") throw new NotFoundException("WITHDRAWAL_NOT_FOUND");
      if (msg === "WITHDRAWAL_NOT_PENDING") throw new ForbiddenException("WITHDRAWAL_NOT_PENDING");
      if (msg === "INSUFFICIENT_BALANCE") throw new BadRequestException("INSUFFICIENT_BALANCE");
      throw e;
    }
  }

  async reject(args: { withdrawalId: string; adminId: string; note?: string }) {
    if (!args.note?.trim()) throw new BadRequestException("NOTE_REQUIRED");

    try {
      const res = await this.repo.rejectWithdrawal({
        withdrawalId: args.withdrawalId,
        adminId: args.adminId,
        note: args.note.trim()
      });

      await this.audit.log({
        actorAdminId: args.adminId,
        action: "WITHDRAWAL_REJECT",
        description: "Rejected withdrawal",
        metadata: { withdrawalId: args.withdrawalId, status: res.status, note: args.note.trim() }
      });

      try {
        const withdrawal = await this.repo.getWithdrawal(args.withdrawalId);
        if (withdrawal?.userId) {
          await this.notifications.create({
            userId: withdrawal.userId,
            type: NotificationType.WITHDRAWAL_REJECTED,
            title: "Withdrawal rejected",
            body: `Your withdrawal request was rejected. Reason: ${args.note.trim()}`,
            idempotencyKey: `notif:withdrawal_rejected:${args.withdrawalId}`,
            data: {
              withdrawalId: args.withdrawalId,
              amountMilliFec: withdrawal.amountMilliFec,
              reason: args.note.trim(),
            },
          });
        }
      } catch {}

      return res;
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg === "WITHDRAWAL_NOT_FOUND") throw new NotFoundException("WITHDRAWAL_NOT_FOUND");
      if (msg === "WITHDRAWAL_NOT_PENDING") throw new ForbiddenException("WITHDRAWAL_NOT_PENDING");
      throw e;
    }
  }

  async markPaid(args: { withdrawalId: string; adminId: string; note?: string }) {
    try {
      const res = await this.repo.markPaid({
        withdrawalId: args.withdrawalId,
        adminId: args.adminId,
        note: args.note?.trim()
      });

      await this.audit.log({
        actorAdminId: args.adminId,
        action: "WITHDRAWAL_MARK_PAID",
        description: "Marked withdrawal as PAID",
        metadata: { withdrawalId: args.withdrawalId, status: res.status }
      });

      try {
        const withdrawal = await this.repo.getWithdrawal(args.withdrawalId);
        if (withdrawal?.userId) {
          await this.notifications.create({
            userId: withdrawal.userId,
            type: NotificationType.WITHDRAWAL_PAID,
            title: "Withdrawal paid",
            body: `Your withdrawal of ${(withdrawal.amountMilliFec / 1000).toFixed(2)} FEC has been paid out.`,
            idempotencyKey: `notif:withdrawal_paid:${args.withdrawalId}`,
            data: {
              withdrawalId: args.withdrawalId,
              amountMilliFec: withdrawal.amountMilliFec,
              note: args.note?.trim() ?? null,
            },
          });
        }
      } catch {}

      return res;
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg === "WITHDRAWAL_NOT_FOUND") throw new NotFoundException("WITHDRAWAL_NOT_FOUND");
      if (msg === "WITHDRAWAL_NOT_APPROVED") throw new ForbiddenException("WITHDRAWAL_NOT_APPROVED");
      throw e;
    }
  }
}