// Path: apps/api/src/admin/finance/admin-ledger.controller.ts
import { BadRequestException, Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole, LedgerEntryDirection, LedgerEntryType } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminLedgerService } from "./admin-ledger.service";

function parsePositiveInt(value: string | undefined, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, max) : fallback;
}

function parseScope(value: string | undefined): "USER" | "PLATFORM" {
  const normalized = value?.trim().toUpperCase() || "USER";
  if (normalized !== "USER" && normalized !== "PLATFORM") {
    throw new BadRequestException("INVALID_LEDGER_SCOPE");
  }
  return normalized;
}

function parseEnum<T extends string>(value: string | undefined, values: readonly T[], error: string): T | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase() as T;
  if (!values.includes(normalized)) throw new BadRequestException(error);
  return normalized;
}

@ApiTags("admin-ledger")
@ApiBearerAuth()
@Public()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.FINANCE_OFFICER)
@Controller("admin/finance/ledger")
export class AdminLedgerController {
  constructor(private readonly service: AdminLedgerService) {}

  @Get()
  async list(
    @Query("scope") scopeParam?: string,
    @Query("userId") userId?: string,
    @Query("walletRole") walletRoleParam?: string,
    @Query("type") typeParam?: string,
    @Query("direction") directionParam?: string,
    @Query("reference") reference?: string,
    @Query("skip") skipParam?: string,
    @Query("take") takeParam?: string,
  ) {
    const scope = parseScope(scopeParam);

    const walletRole = parseEnum(
      walletRoleParam,
      ["CLIENT", "FIXER"] as const,
      "INVALID_WALLET_ROLE",
    );

    const type = parseEnum(
      typeParam,
      [
        "DEPOSIT",
        "WITHDRAWAL_REQUEST",
        "WITHDRAWAL_APPROVED",
        "WITHDRAWAL_REJECTED",
        "JOB_PAYMENT",
        "JOB_PAYOUT",
        "COMMISSION",
        "ADJUSTMENT",
        "FEE",
      ] as const,
      "INVALID_LEDGER_TYPE",
    );

    const direction = parseEnum(
      directionParam,
      ["CREDIT", "DEBIT"] as const,
      "INVALID_LEDGER_DIRECTION",
    );

    if (scope === "PLATFORM" && (userId || walletRole)) {
      throw new BadRequestException("PLATFORM_LEDGER_DOES_NOT_ACCEPT_USER_FILTERS");
    }

    return this.service.list({
      scope,
      userId: userId?.trim() || undefined,
      walletRole,
      type: type as LedgerEntryType | undefined,
      direction: direction as LedgerEntryDirection | undefined,
      reference: reference?.trim() || undefined,
      skip: parsePositiveInt(skipParam, 0, 1000000),
      take: parsePositiveInt(takeParam, 50, 100),
    });
  }

  @Get(":scope/:id")
  async get(@Param("scope") scopeParam: string, @Param("id") id: string) {
    const scope = parseScope(scopeParam);
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new BadRequestException("LEDGER_ENTRY_ID_REQUIRED");
    }

    return this.service.get(scope, normalizedId);
  }
}
