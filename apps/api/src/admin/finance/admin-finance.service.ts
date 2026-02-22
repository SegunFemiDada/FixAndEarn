import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminFinanceRepo } from "./admin-finance.repo";

@Injectable()
export class AdminFinanceService {
  constructor(private readonly repo: AdminFinanceRepo, private readonly audit: AdminAuditService) {}

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

      return res;
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg === "WITHDRAWAL_NOT_FOUND") throw new NotFoundException("WITHDRAWAL_NOT_FOUND");
      if (msg === "WITHDRAWAL_NOT_APPROVED") throw new ForbiddenException("WITHDRAWAL_NOT_APPROVED");
      throw e;
    }
  }
}
