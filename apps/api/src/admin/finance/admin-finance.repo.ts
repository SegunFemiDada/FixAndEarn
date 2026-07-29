//path: apps/api/src/admin/finance/admin-finance.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { WalletRole } from "@prisma/client";

@Injectable()
export class AdminFinanceRepo {
  constructor(private readonly prisma: PrismaService) {}

  listWithdrawals(status: any, skip: number, take: number) {
  return this.prisma.withdrawalRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" }, // FIXED (latest first)
    skip,
    take,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          
        },
      },
    },
  });
}

  async getWithdrawal(id: string) {
  const row = await this.prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          bankDetails: true,
        },
      },
    },
  });

  if (!row) return null;

  const wallet = await this.prisma.wallet.findUnique({
    where: {
      userId_role: {
        userId: row.userId,
        role: WalletRole.FIXER,
      },
    },
    select: {
      id: true,
      role: true,
      balanceMilliFec: true,
    },
  });

  return {
    ...row, // ✅ includes payoutMode already
    user: {
      ...row.user,
      wallet,
    },
  };
}

  async getWithdrawalEarningsTrace(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
  where: {
    id: withdrawalId,
  },
  select: {
    id: true,
    userId: true,
    amountMilliFec: true,
    status: true,
    createdAt: true,
    reviewedAt: true,
    paidAt: true,
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    },
  },
});

if (!withdrawal) {
  return null;
}

const allocations =
  await this.prisma.withdrawalAllocation.findMany({
    where: {
      withdrawalId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      earning: {
        include: {
          job: {
            include: {
              dispute: {
                select: {
                  id: true,
                  resolutionType: true,
                  resolvedAt: true,
                },
              },
            },
          },
        },
      },
    },
  });
  
  let cumulativeCoveredMilliFec = 0;

const entries = allocations.map((allocation) => {
  cumulativeCoveredMilliFec += allocation.amountMilliFec;

  return {
    allocationId: allocation.id,

    earningId: allocation.earning.id,

    amountMilliFec: allocation.amountMilliFec,

    allocatedMilliFec:
    allocation.amountMilliFec,

    remainingAvailableMilliFec:
    allocation.earning.availableMilliFec,

    earningStatus:
      allocation.earning.status,

    earnedAt:
      allocation.earning.createdAt,

      withdrawalAllocationId:
    allocation.id,

    cumulativeCoveredMilliFec,

    coversWithdrawalAfterThisEntry:
      cumulativeCoveredMilliFec >=
      withdrawal.amountMilliFec,

    job: {
      id: allocation.earning.job.id,

      clientId:
        allocation.earning.job.clientId,

      fixerId:
        allocation.earning.job.fixerId,

      status:
        allocation.earning.job.status,

      lockedPriceMilliFec:
        allocation.earning.job.lockedPriceMilliFec,

      priceMilliFec:
        allocation.earning.job.priceMilliFec,

      completedApprovedAt:
        allocation.earning.job.completedApprovedAt,

      dispute:
        allocation.earning.job.dispute,
    },
  };
});
const totalAllocatedMilliFec =
  entries.reduce(
    (sum, e) => sum + e.amountMilliFec,
    0
  );
  const totalRemainingAvailableMilliFec =
  allocations.reduce(
    (sum, allocation) =>
      sum + allocation.earning.availableMilliFec,
    0
  );

const coverageReached =
  totalAllocatedMilliFec >=
  withdrawal.amountMilliFec;

const remainingUncoveredMilliFec =
  Math.max(
    withdrawal.amountMilliFec -
      totalAllocatedMilliFec,
    0
  );

const reasons: string[] = [];

if (entries.length === 0) {
  reasons.push(
    "No earnings were allocated to this withdrawal."
  );
}

if (!coverageReached) {
  reasons.push(
    "Allocated earnings do not fully cover the withdrawal amount."
  );
}

const missingJob = entries.some(
  (e) => !e.job
);

if (missingJob) {
  reasons.push(
    "One or more allocated earnings have no linked job."
  );
}

const invalidCompletion = entries.some(
  (e) =>
    !e.job.completedApprovedAt &&
    !e.job.dispute
);

if (invalidCompletion) {
  reasons.push(
    "One or more earnings were created without a completed job or dispute resolution."
  );
}
return {
  withdrawal,

  allocationCount: allocations.length,

  summary: {
    totalEarningCreditsMilliFec:
      totalAllocatedMilliFec,

    withdrawalAmountMilliFec:
      withdrawal.amountMilliFec,

    cumulativeCoveredMilliFec:
      Math.min(
        totalAllocatedMilliFec,
        withdrawal.amountMilliFec
      ),

    coverageReached,

    remainingUncoveredMilliFec,
    remainingAvailableMilliFec:
  totalRemainingAvailableMilliFec,

    autoAssessment: {
      status:
        reasons.length === 0
          ? "PASS"
          : "FLAG",

      reasons,

      checkedAt: new Date(),
    },
  },

  entries,
};
  }

  async approveWithdrawal(args: {
  withdrawalId: string;
  adminId: string;
  note?: string | null;
}) {
  const { withdrawalId, adminId, note } = args;

  return this.prisma.$transaction(async (tx) => {
    const wr = await tx.withdrawalRequest.findUnique({
      where: {
        id: withdrawalId,
      },
    });

    if (!wr) {
      throw new Error("WITHDRAWAL_NOT_FOUND");
    }

    if (wr.status === "APPROVED") {
      return {
        ok: true,
        status: "APPROVED" as const,
      };
    }

    if (wr.status === "PAID") {
      return {
        ok: true,
        status: "PAID" as const,
      };
    }

    if (wr.status !== "PENDING") {
      throw new Error("WITHDRAWAL_NOT_PENDING");
    }

    await tx.withdrawalRequest.update({
      where: {
        id: withdrawalId,
      },
      data: {
        status: "APPROVED",
        reviewedBy: adminId,
        reviewNote: note ?? null,
        reviewedAt: new Date(),
      },
    });

    return {
      ok: true,
      status: "APPROVED" as const,
    };
  });
}

  async rejectWithdrawal(args: {
  withdrawalId: string;
  adminId: string;
  note?: string | null;
}) {
  const { withdrawalId, adminId, note } = args;

  return this.prisma.$transaction(async (tx) => {
    const wr = await tx.withdrawalRequest.findUnique({
      where: {
        id: withdrawalId,
      },
    });

    if (!wr) {
      throw new Error("WITHDRAWAL_NOT_FOUND");
    }

    if (wr.status === "REJECTED") {
      return {
        ok: true,
        status: "REJECTED" as const,
      };
    }

    if (wr.status === "PAID") {
      return {
        ok: true,
        status: "PAID" as const,
      };
    }

    if (wr.status !== "PENDING") {
      throw new Error("WITHDRAWAL_NOT_PENDING");
    }

    const allocations = await tx.withdrawalAllocation.findMany({
  where: {
    withdrawalId,
  },
  include: {
    earning: true,
  },
});

for (const allocation of allocations) {
  await tx.fixerEarning.update({
    where: {
      id: allocation.earningId,
    },
    data: {
      availableMilliFec: {
        increment: allocation.amountMilliFec,
      },
      status: "AVAILABLE",
    },
  });
}

await tx.withdrawalAllocation.deleteMany({
  where: {
    withdrawalId,
  },
});

    await tx.withdrawalRequest.update({
      where: {
        id: withdrawalId,
      },
      data: {
        status: "REJECTED",
        reviewedBy: adminId,
        reviewNote: note ?? null,
        reviewedAt: new Date(),
      },
    });

    return {
      ok: true,
      status: "REJECTED" as const,
    };
  });
}

  async markpaid(args: { withdrawalId: string; adminId: string; note?: string | null }) {
    const { withdrawalId, adminId, note } = args;

    return this.prisma.$transaction(async (tx) => {
      const wr = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
      if (!wr) throw new Error("WITHDRAWAL_NOT_FOUND");

      if (wr.status === "PAID") return { ok: true, status: "PAID" as const };
      if (wr.status !== "APPROVED") throw new Error("WITHDRAWAL_NOT_APPROVED");

      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          reviewedBy: adminId,
          reviewNote: note ?? wr.reviewNote ?? null,
          paidAt: new Date(),
        },
      });

      return { ok: true, status: "PAID" as const };
    });
  }
}