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
const wallet = await this.prisma.wallet.findUnique({
  where: {
    userId_role: {
      userId: withdrawal.userId,
      role: WalletRole.FIXER,
    },
  },
  select: {
    id: true,
    balanceMilliFec: true,
    role: true,
  },
});

const lifetimeEarnings = await this.prisma.fixerEarning.findMany({
  where: {
    fixerId: withdrawal.userId,
  },
  include: {
    allocations: true,
  },
});

const previousWithdrawals =
  await this.prisma.withdrawalRequest.findMany({
    where: {
      userId: withdrawal.userId,
    },
    select: {
      id: true,
      amountMilliFec: true,
      status: true,
    },
  });
  const lifetimeEarnedMilliFec =
  lifetimeEarnings.reduce(
    (sum, earning) =>
      sum +
      earning.availableMilliFec +
      earning.allocations.reduce(
        (s, allocation) =>
          s + allocation.amountMilliFec,
        0
      ),
    0
  );

const lifetimeAllocatedMilliFec =
  lifetimeEarnings.reduce(
    (sum, earning) =>
      sum +
      earning.allocations.reduce(
        (s, allocation) =>
          s + allocation.amountMilliFec,
        0
      ),
    0
  );

const paidWithdrawalsMilliFec =
  previousWithdrawals
    .filter((w) => w.status === "PAID")
    .reduce(
      (sum, w) =>
        sum + w.amountMilliFec,
      0
    );

const pendingWithdrawalsMilliFec =
  previousWithdrawals
    .filter((w) =>
      w.status === "PENDING" ||
      w.status === "APPROVED" ||
      w.status === "PROCESSING"
    )
    .reduce(
      (sum, w) =>
        sum + w.amountMilliFec,
      0
    );

const expectedWalletBalanceMilliFec =
  lifetimeEarnedMilliFec -
  lifetimeAllocatedMilliFec;

const walletDifferenceMilliFec =
  (wallet?.balanceMilliFec ?? 0) -
  expectedWalletBalanceMilliFec;

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
    client: {
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    },

    fixer: {
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    },

    payments: {
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    },

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

  status: allocation.earning.job.status,

  clientId: allocation.earning.job.clientId,

  fixerId: allocation.earning.job.fixerId,

  priceMilliFec:
    allocation.earning.job.priceMilliFec,

  lockedPriceMilliFec:
    allocation.earning.job.lockedPriceMilliFec,

  completedApprovedAt:
    allocation.earning.job.completedApprovedAt,

  client:
    allocation.earning.job.client,

  fixer:
    allocation.earning.job.fixer,

  latestPayment:
    allocation.earning.job.payments[0] ?? null,

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
const warnings: string[] = [];
const critical: string[] = [];

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
if (walletDifferenceMilliFec !== 0) {
  critical.push(
    "Wallet balance does not match calculated earnings."
  );
}
const wrongFixer = entries.some(
  (entry) =>
    entry.job.fixerId !== withdrawal.userId
);

if (wrongFixer) {
  critical.push(
    "One or more earnings belong to another fixer."
  );
}
const missingClient = entries.some(
  (entry) => !entry.job.client
);

if (missingClient) {
  critical.push(
    "One or more jobs have no client."
  );
}
const missingPayment = entries.some(
  (entry) => !entry.job.latestPayment
);

if (missingPayment) {
  critical.push(
    "One or more jobs have no payment record."
  );
}
const duplicateJobs =
  new Set(entries.map((e) => e.job.id)).size !==
  entries.length;

if (duplicateJobs) {
  critical.push(
    "Duplicate job detected in withdrawal."
  );
}
const duplicateEarnings =
  new Set(entries.map((e) => e.earningId)).size !==
  entries.length;

if (duplicateEarnings) {
  critical.push(
    "Duplicate earning detected."
  );
}
const negativeAvailable =
  allocations.some(
    (allocation) =>
      allocation.earning.availableMilliFec < 0
  );

if (negativeAvailable) {
  critical.push(
    "Negative earning balance detected."
  );
}
const priceMismatch =
  entries.some((entry) => {

    if (
      !entry.job.lockedPriceMilliFec
    ) {
      return false;
    }

    return (
      entry.job.lockedPriceMilliFec <
      entry.amountMilliFec
    );
  });

if (priceMismatch) {
  warnings.push(
    "Allocated earning exceeds agreed job price."
  );
}
let score = 0;

score += warnings.length * 10;

score += critical.length * 40;

let level =
  "LOW";

if (score >= 25) {
  level = "MEDIUM";
}

if (score >= 50) {
  level = "HIGH";
}

if (score >= 80) {
  level = "CRITICAL";
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
  wallet,

lifetime: {
  earnedMilliFec:
    lifetimeEarnedMilliFec,

  allocatedMilliFec:
    lifetimeAllocatedMilliFec,

  paidWithdrawalsMilliFec,

  pendingWithdrawalsMilliFec,

  expectedWalletBalanceMilliFec,

  actualWalletBalanceMilliFec:
    wallet?.balanceMilliFec ?? 0,

  walletDifferenceMilliFec,
},

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
  integrity: {
  walletMatches:
    walletDifferenceMilliFec === 0,

  expectedWalletBalanceMilliFec,

  actualWalletBalanceMilliFec:
    wallet?.balanceMilliFec ?? 0,

  differenceMilliFec:
    walletDifferenceMilliFec,
},
risk: {
  score,

  level,

  warnings,

  critical,
},

recommendation: {
  action:
    level === "LOW"
      ? "APPROVE"
      : level === "MEDIUM"
      ? "MANUAL_REVIEW"
      : "REJECT",
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