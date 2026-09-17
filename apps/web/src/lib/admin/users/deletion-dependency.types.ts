export type AdminDeletionDependencyJob = {
  id: string;
  status: string;
  skillCategory: string;
  priceMilliFec: number;
  lockedPriceMilliFec: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminDeletionDependencyApplication = {
  id: string;
  jobId: string;
  status: string;
  createdAt: string;
  job: {
    id: string;
    status: string;
    clientId: string;
    fixerId: string | null;
    skillCategory: string;
  };
};

export type AdminDeletionDependencyDispute = {
  id: string;
  jobId: string;
  openedByUserId: string;
  reason: string;
  status: string;
  createdAt: string;
  job: {
    id: string;
    status: string;
    clientId: string;
    fixerId: string | null;
  };
};

export type AdminDeletionDependencyWithdrawal = {
  id: string;
  amountMilliFec: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDeletionDependencyDeposit = {
  id: string;
  reference: string;
  amountMilliFec: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDeletionDependencyJobPayment = {
  id: string;
  jobId: string;
  amountMilliFec: number;
  paymentFeeMilliFec: number;
  status: string;
  type: string;
  paymentReference: string;
  createdAt: string;
  expiresAt: string | null;
  job: {
    id: string;
    clientId: string;
    fixerId: string | null;
    status: string;
  };
};

export type AdminDeletionDependencyEarning = {
  id: string;
  jobId: string;
  amountMilliFec: number;
  availableMilliFec: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDeletionDependencyCompletionRequest = {
  id: string;
  jobId: string;
  fixerId: string;
  status: string;
  requestedAt: string;
  job: {
    id: string;
    status: string;
    clientId: string;
    fixerId: string | null;
  };
};

export type AdminDeletionDependencyWallet = {
  id: string;
  role: string;
  balanceMilliFec: number;
};

export type AdminDeletionDependencyBlocker = {
  code: string;
  title: string;
  count: number;
  amountMilliFec: number | null;
  items: unknown[];
};

export type AdminDeletionDependencies = {
  user: {
    id: string;
    fullName: string;
    email: string;
    deletionRequestStatus: string;
    deletionRequestedAt: string | null;
  };
  canApprove: boolean;
  blockers: AdminDeletionDependencyBlocker[];
  warnings: {
    openConversations: Array<{
      id: string;
      jobId: string;
      fixerId: string;
      status: string;
      active: boolean;
      updatedAt: string;
    }>;
    bankDetailsPresent: boolean;
    verificationPresent: boolean;
    verificationStatus: string | null;
    verificationFilesPresent: boolean;
    ledgerEntryCount: number;
  };
  summary: {
    walletCount: number;
    nonZeroWalletCount: number;
    activeJobsPostedCount: number;
    activeJobsAssignedCount: number;
    pendingApplicationsCount: number;
    openDisputesCount: number;
    pendingWithdrawalsCount: number;
    pendingDepositsCount: number;
    pendingJobPaymentsCount: number;
    availableEarningsMilliFec: number;
    pendingCompletionRequestsCount: number;
    openConversationsCount: number;
    ledgerEntryCount: number;
  };
};
