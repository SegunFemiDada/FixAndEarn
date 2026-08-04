// path: apps/web/src/lib/admin/finance/types.ts

export type WithdrawalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAID";

export type WithdrawalListItem = {
  id: string;
  userId: string;
  amountMilliFec: number;
  status: WithdrawalStatus;
  payoutMode?: "PAYSTACK" | "MANUAL";
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
  paystackTransferReference: string | null;
  paystackTransferCode: string | null;
  paystackTransferId: string | null;

  user: {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
  };
};

export type WithdrawalDetail = {
  id: string;
  userId: string;
  amountMilliFec: number;
  status: WithdrawalStatus;
  payoutMode?: "PAYSTACK" | "MANUAL";
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
  paystackTransferReference: string | null;
  paystackTransferCode: string | null;
  paystackTransferId: string | null;

  user: {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;

    bankDetails: {
      bankName: string | null;
      accountName: string | null;
      accountNumber: string | null;
      bankCode?: string | null;
      paystackRecipientCode?: string | null;
    } | null;

    wallet: {
      id: string;
      balanceMilliFec: number;
    } | null;
  };
};

export type WithdrawalEarningsTraceEntry = {
  allocationId: string;

  earningId: string;

  amountMilliFec: number;

  availableMilliFec: number;

  earningStatus: string;

  earnedAt: string;

  cumulativeCoveredMilliFec: number;

  coversWithdrawalAfterThisEntry: boolean;

  job: {
    id: string;

    clientId: string | null;

    fixerId: string | null;

    status: string;

    lockedPriceMilliFec: number | null;

    priceMilliFec: number | null;

    completedApprovedAt: string | null;

    client: {
      id: string;
      fullName: string;
      email: string;
      isActive: boolean;
    } | null;

    fixer: {
      id: string;
      fullName: string;
      email: string;
      isActive: boolean;
    } | null;

    latestPayment: {
      id: string;
      status: string;
      amountMilliFec: number;
      createdAt: string;
      providerReference?: string | null;
    } | null;

    dispute: {
      id: string;
      resolutionType: string | null;
      resolvedAt: string | null;
    } | null;
  };
};

export type WithdrawalEarningsTrace = {
  withdrawal: {
    id: string;
    userId: string;
    amountMilliFec: number;
    status: WithdrawalStatus;
    createdAt: string;
    reviewedAt: string | null;
    paidAt: string | null;

    user: {
      id: string;
      email: string;
      fullName: string;
      isActive: boolean;
    };
  };

  wallet: {
    id: string;
    balanceMilliFec: number;
    role: string;
  } | null;

  lifetime: {
    earnedMilliFec: number;
    allocatedMilliFec: number;
    paidWithdrawalsMilliFec: number;
    pendingWithdrawalsMilliFec: number;
    expectedWalletBalanceMilliFec: number;
    actualWalletBalanceMilliFec: number;
    walletDifferenceMilliFec: number;
  };

  summary: {
    totalEarningCreditsMilliFec: number;
    withdrawalAmountMilliFec: number;
    cumulativeCoveredMilliFec: number;
    coverageReached: boolean;
    remainingUncoveredMilliFec: number;
    remainingAvailableMilliFec: number;

    autoAssessment: {
      status: "PASS" | "FLAG";
      reasons: string[];
      checkedAt: string;
    };
  };

  integrity: {
    walletMatches: boolean;
    expectedWalletBalanceMilliFec: number;
    actualWalletBalanceMilliFec: number;
    differenceMilliFec: number;
  };

  risk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    warnings: string[];
    critical: string[];
  };

  recommendation: {
    action: "APPROVE" | "MANUAL_REVIEW" | "REJECT";
  };

  entries: WithdrawalEarningsTraceEntry[];
};

export type ListWithdrawalsParams = {
  status?: WithdrawalStatus;
  skip?: number;
  take?: number;
};

export type ReviewWithdrawalPayload = {
  note?: string;
};

export type ReviewWithdrawalResponse = {
  ok: true;
  status: WithdrawalStatus;
};