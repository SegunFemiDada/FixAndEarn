export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

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
  id: string;
  type: string;
  amountMilliFec: number;
  createdAt: string;
  reference: string | null;
  payoutSource: string | null;
  jobId: string | null;
  clientId: string | null;
  fixerId: string | null;
  grossAmountMilliFec: number | null;
  netAmountMilliFec: number | null;
  commissionMilliFec: number | null;
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
    dispute: {
      id: string;
      resolutionType: string | null;
      resolvedAt: string | null;
    } | null;
  } | null;
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
    createdAt: string;
    updatedAt: string;
  } | null;
  summary: {
    totalEarningCreditsMilliFec: number;
    withdrawalAmountMilliFec: number;
    cumulativeCoveredMilliFec: number;
    coverageReached: boolean;
    remainingUncoveredMilliFec: number;
    autoAssessment: {
      status: "PASS" | "FLAG";
      reasons: string[];
      checkedAt: string;
    };
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