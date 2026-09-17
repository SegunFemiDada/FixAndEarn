// Path: apps/api/src/admin/finance/admin-ledger.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { LedgerEntryDirection, LedgerEntryType, WalletRole } from "@prisma/client";
import { AdminLedgerRepo } from "./admin-ledger.repo";

@Injectable()
export class AdminLedgerService {
  constructor(private readonly repo: AdminLedgerRepo) {}

  async list(args: {
    scope: "USER" | "PLATFORM";
    userId?: string;
    walletRole?: WalletRole;
    type?: LedgerEntryType;
    direction?: LedgerEntryDirection;
    reference?: string;
    skip: number;
    take: number;
  }) {
    return this.repo.list(args);
  }

  async get(scope: "USER" | "PLATFORM", id: string) {
    const result =
      scope === "USER"
        ? await this.repo.getUserEntry(id)
        : await this.repo.getPlatformEntry(id);

    if (!result) {
      throw new NotFoundException("LEDGER_ENTRY_NOT_FOUND");
    }

    return result;
  }
}
