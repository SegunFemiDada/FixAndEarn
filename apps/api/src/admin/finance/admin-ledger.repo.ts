// Path: apps/api/src/admin/finance/admin-ledger.repo.ts
import { Injectable } from "@nestjs/common";
import { LedgerEntryDirection, LedgerEntryType, Prisma, WalletRole } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

type LedgerScope = "USER" | "PLATFORM";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataString(metadata: Prisma.JsonValue | null | undefined, key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  return asString((metadata as Record<string, unknown>)[key]);
}

@Injectable()
export class AdminLedgerRepo {
  constructor(private readonly prisma: PrismaService) {}

  async list(args: {
    scope: LedgerScope;
    userId?: string;
    walletRole?: WalletRole;
    type?: LedgerEntryType;
    direction?: LedgerEntryDirection;
    reference?: string;
    skip: number;
    take: number;
  }) {
    if (args.scope === "PLATFORM") {
      const where: Prisma.PlatformLedgerEntryWhereInput = {
        type: args.type,
        direction: args.direction,
        reference: args.reference
          ? { contains: args.reference, mode: "insensitive" }
          : undefined,
      };

      const [items, total] = await this.prisma.$transaction([
        this.prisma.platformLedgerEntry.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: args.skip,
          take: args.take,
        }),
        this.prisma.platformLedgerEntry.count({ where }),
      ]);

      return {
        scope: args.scope,
        items: items.map((entry) => ({
          id: entry.id,
          scope: "PLATFORM" as const,
          walletId: entry.platformWalletId,
          userId: null,
          walletRole: "SYSTEM" as const,
          type: entry.type,
          direction: entry.direction,
          amountMilliFec: entry.amountMilliFec,
          reference: entry.reference,
          metadata: entry.metadata,
          createdAt: entry.createdAt,
        })),
        total,
        skip: args.skip,
        take: args.take,
      };
    }

    const where: Prisma.LedgerEntryWhereInput = {
      type: args.type,
      direction: args.direction,
      reference: args.reference
        ? { contains: args.reference, mode: "insensitive" }
        : undefined,
      wallet: {
        userId: args.userId,
        role: args.walletRole,
      },
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.ledgerEntry.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: args.skip,
        take: args.take,
        include: {
          wallet: {
            select: {
              userId: true,
              role: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  isActive: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return {
      scope: args.scope,
      items: rows.map((entry) => ({
        id: entry.id,
        scope: "USER" as const,
        walletId: entry.walletId,
        userId: entry.wallet.userId,
        walletRole: entry.wallet.role,
        type: entry.type,
        direction: entry.direction,
        amountMilliFec: entry.amountMilliFec,
        reference: entry.reference,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
        user: entry.wallet.user,
      })),
      total,
      skip: args.skip,
      take: args.take,
    };
  }

  async getUserEntry(id: string) {
    const entry = await this.prisma.ledgerEntry.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!entry) return null;

    return this.buildUserInvestigation(entry);
  }

  async getPlatformEntry(id: string) {
    const entry = await this.prisma.platformLedgerEntry.findUnique({
      where: { id },
      include: {
        platformWallet: true,
      },
    });

    if (!entry) return null;

    return this.buildPlatformInvestigation(entry);
  }

  private async buildUserInvestigation(
    entry: Prisma.LedgerEntryGetPayload<{
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true;
                fullName: true;
                email: true;
                isActive: true;
                createdAt: true;
              };
            };
          };
        };
      };
    }>,
  ) {
    const metadataJobId = metadataString(entry.metadata, "jobId");
    const metadataPaymentId = metadataString(entry.metadata, "paymentId");
    const metadataWithdrawalId = metadataString(entry.metadata, "withdrawalId");

    const [beforeRows, afterRows, walletEntries, deposit, withdrawal, paymentByReference, paymentById, jobByMetadata] =
      await Promise.all([
        this.prisma.ledgerEntry.findMany({
          where: {
            walletId: entry.walletId,
            OR: [
              { createdAt: { lt: entry.createdAt } },
              { createdAt: entry.createdAt, id: { lt: entry.id } },
            ],
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 10,
        }),
        this.prisma.ledgerEntry.findMany({
          where: {
            walletId: entry.walletId,
            OR: [
              { createdAt: { gt: entry.createdAt } },
              { createdAt: entry.createdAt, id: { gt: entry.id } },
            ],
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 10,
        }),
        this.prisma.ledgerEntry.findMany({
          where: { walletId: entry.walletId },
          select: { direction: true, amountMilliFec: true },
        }),
        entry.reference
          ? this.prisma.deposit.findUnique({ where: { reference: entry.reference } })
          : Promise.resolve(null),
        metadataWithdrawalId
          ? this.prisma.withdrawalRequest.findUnique({
              where: { id: metadataWithdrawalId },
              include: { user: { select: { id: true, fullName: true, email: true, isActive: true } } },
            })
          : entry.reference
            ? this.prisma.withdrawalRequest.findUnique({
                where: { id: entry.reference },
                include: { user: { select: { id: true, fullName: true, email: true, isActive: true } } },
              })
            : Promise.resolve(null),
        entry.reference
          ? this.prisma.jobPayment.findUnique({
              where: { paymentReference: entry.reference },
              include: { job: { select: { id: true, clientId: true, fixerId: true, status: true, priceMilliFec: true, lockedPriceMilliFec: true } } },
            })
          : Promise.resolve(null),
        metadataPaymentId
          ? this.prisma.jobPayment.findUnique({
              where: { id: metadataPaymentId },
              include: { job: { select: { id: true, clientId: true, fixerId: true, status: true, priceMilliFec: true, lockedPriceMilliFec: true } } },
            })
          : Promise.resolve(null),
        metadataJobId
          ? this.prisma.job.findUnique({
              where: { id: metadataJobId },
              include: {
                client: { select: { id: true, fullName: true, email: true, isActive: true } },
                fixer: { select: { id: true, fullName: true, email: true, isActive: true } },
                payments: { orderBy: { createdAt: "desc" }, take: 10 },
                dispute: true,
                earnings: true,
                PlatformRevenue: true,
              },
            })
          : Promise.resolve(null),
      ]);

    const relatedJobId =
      jobByMetadata?.id ??
      paymentByReference?.jobId ??
      paymentById?.jobId ??
      null;

    const relatedJob = relatedJobId && !jobByMetadata
      ? await this.prisma.job.findUnique({
          where: { id: relatedJobId },
          include: {
            client: { select: { id: true, fullName: true, email: true, isActive: true } },
            fixer: { select: { id: true, fullName: true, email: true, isActive: true } },
            payments: { orderBy: { createdAt: "desc" }, take: 10 },
            dispute: true,
            earnings: true,
            PlatformRevenue: true,
          },
        })
      : jobByMetadata;

    const calculatedBalanceMilliFec = walletEntries.reduce(
      (sum: number, row: { direction: LedgerEntryDirection; amountMilliFec: number }) => row.direction === "CREDIT"
        ? sum + row.amountMilliFec
        : sum - row.amountMilliFec,
      0,
    );

    const actualBalanceMilliFec = entry.wallet.balanceMilliFec;

    return {
      scope: "USER" as const,
      entry: {
        id: entry.id,
        walletId: entry.walletId,
        type: entry.type,
        direction: entry.direction,
        amountMilliFec: entry.amountMilliFec,
        idempotencyKey: entry.idempotencyKey,
        reference: entry.reference,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
      },
      wallet: {
        id: entry.wallet.id,
        userId: entry.wallet.userId,
        role: entry.wallet.role,
        actualBalanceMilliFec,
        calculatedBalanceMilliFec,
        differenceMilliFec: actualBalanceMilliFec - calculatedBalanceMilliFec,
      },
      user: entry.wallet.user,
      surroundingEntries: {
        before: beforeRows.reverse(),
        after: afterRows,
      },
      related: {
        deposit,
        withdrawal,
        jobPayment: paymentByReference ?? paymentById,
        job: relatedJob,
        earnings: relatedJob?.earnings ?? null,
        platformRevenue: relatedJob?.PlatformRevenue ?? null,
      },
    };
  }

  private async buildPlatformInvestigation(
    entry: Prisma.PlatformLedgerEntryGetPayload<{
      include: { platformWallet: true };
    }>,
  ) {
    const metadataJobId = metadataString(entry.metadata, "jobId");
    const metadataPaymentId = metadataString(entry.metadata, "paymentId");

    const [beforeRows, afterRows, walletEntries, paymentByReference, paymentById, revenueByJobId] =
      await Promise.all([
        this.prisma.platformLedgerEntry.findMany({
          where: {
            platformWalletId: entry.platformWalletId,
            OR: [
              { createdAt: { lt: entry.createdAt } },
              { createdAt: entry.createdAt, id: { lt: entry.id } },
            ],
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 10,
        }),
        this.prisma.platformLedgerEntry.findMany({
          where: {
            platformWalletId: entry.platformWalletId,
            OR: [
              { createdAt: { gt: entry.createdAt } },
              { createdAt: entry.createdAt, id: { gt: entry.id } },
            ],
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 10,
        }),
        this.prisma.platformLedgerEntry.findMany({
          where: { platformWalletId: entry.platformWalletId },
          select: { direction: true, amountMilliFec: true },
        }),
        entry.reference
          ? this.prisma.jobPayment.findUnique({
              where: { paymentReference: entry.reference },
              include: { job: { select: { id: true, clientId: true, fixerId: true, status: true, priceMilliFec: true, lockedPriceMilliFec: true } } },
            })
          : Promise.resolve(null),
        metadataPaymentId
          ? this.prisma.jobPayment.findUnique({
              where: { id: metadataPaymentId },
              include: { job: { select: { id: true, clientId: true, fixerId: true, status: true, priceMilliFec: true, lockedPriceMilliFec: true } } },
            })
          : Promise.resolve(null),
        metadataJobId
          ? this.prisma.platformRevenue.findUnique({ where: { jobId: metadataJobId } })
          : Promise.resolve(null),
      ]);

    const relatedJobId = revenueByJobId?.jobId ?? paymentByReference?.jobId ?? paymentById?.jobId ?? metadataJobId ?? null;

    const relatedJob = relatedJobId
      ? await this.prisma.job.findUnique({
          where: { id: relatedJobId },
          include: {
            client: { select: { id: true, fullName: true, email: true, isActive: true } },
            fixer: { select: { id: true, fullName: true, email: true, isActive: true } },
            payments: { orderBy: { createdAt: "desc" }, take: 10 },
            dispute: true,
            earnings: true,
            PlatformRevenue: true,
          },
        })
      : null;

    const calculatedBalanceMilliFec = walletEntries.reduce(
      (sum: number, row: { direction: LedgerEntryDirection; amountMilliFec: number }) => row.direction === "CREDIT"
        ? sum + row.amountMilliFec
        : sum - row.amountMilliFec,
      0,
    );

    const actualBalanceMilliFec = entry.platformWallet.balanceMilliFec;

    return {
      scope: "PLATFORM" as const,
      entry: {
        id: entry.id,
        platformWalletId: entry.platformWalletId,
        type: entry.type,
        direction: entry.direction,
        amountMilliFec: entry.amountMilliFec,
        idempotencyKey: entry.idempotencyKey,
        reference: entry.reference,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
      },
      wallet: {
        id: entry.platformWallet.id,
        actualBalanceMilliFec,
        calculatedBalanceMilliFec,
        differenceMilliFec: actualBalanceMilliFec - calculatedBalanceMilliFec,
      },
      surroundingEntries: {
        before: beforeRows.reverse(),
        after: afterRows,
      },
      related: {
        jobPayment: paymentByReference ?? paymentById,
        job: relatedJob,
        platformRevenue: revenueByJobId,
      },
    };
  }
}
