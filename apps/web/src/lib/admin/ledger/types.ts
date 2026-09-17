export type AdminLedgerScope = "USER" | "PLATFORM";
export type AdminLedgerWalletRole = "CLIENT" | "FIXER" | "SYSTEM";
export type AdminLedgerDirection = "CREDIT" | "DEBIT";

export type AdminLedgerType =
  | "DEPOSIT"
  | "WITHDRAWAL_REQUEST"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_REJECTED"
  | "JOB_PAYMENT"
  | "JOB_PAYOUT"
  | "COMMISSION"
  | "ADJUSTMENT"
  | "FEE";

export type AdminLedgerSearchParams = {
  scope?: AdminLedgerScope;
  userId?: string;
  walletRole?: Exclude<AdminLedgerWalletRole, "SYSTEM">;
  type?: AdminLedgerType;
  direction?: AdminLedgerDirection;
  reference?: string;
  skip?: number;
  take?: number;
};

export type AdminLedgerListUser = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
};

export type AdminLedgerListItem = {
  id: string;
  scope: AdminLedgerScope;
  walletId: string;
  userId: string | null;
  walletRole: AdminLedgerWalletRole;
  type: AdminLedgerType;
  direction: AdminLedgerDirection;
  amountMilliFec: number;
  reference: string | null;
  metadata: unknown;
  createdAt: string;
  user?: AdminLedgerListUser;
};

export type AdminLedgerListResponse = {
  scope: AdminLedgerScope;
  items: AdminLedgerListItem[];
  total: number;
  skip: number;
  take: number;
};

export type AdminLedgerUser = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminLedgerWallet = {
  id: string;
  userId?: string;
  role?: AdminLedgerWalletRole;
  actualBalanceMilliFec: number;
  calculatedBalanceMilliFec: number;
  differenceMilliFec: number;
};

export type AdminLedgerPlatformWallet = {
  id: string;
  actualBalanceMilliFec: number;
  calculatedBalanceMilliFec: number;
  differenceMilliFec: number;
};

export type AdminLedgerEntryDetail = {
  id: string;
  walletId?: string;
  platformWalletId?: string;
  type: AdminLedgerType;
  direction: AdminLedgerDirection;
  amountMilliFec: number;
  idempotencyKey: string | null;
  reference: string | null;
  metadata: unknown;
  createdAt: string;
};

export type AdminLedgerSurroundingEntry = {
  id: string;
  walletId?: string;
  platformWalletId?: string;
  type: AdminLedgerType;
  direction: AdminLedgerDirection;
  amountMilliFec: number;
  reference: string | null;
  metadata: unknown;
  createdAt: string;
};

export type AdminLedgerRelatedUser = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
};

export type AdminLedgerRelatedJob = {
  id: string;
  clientId: string;
  fixerId: string | null;
  status: string;
  priceMilliFec: number;
  lockedPriceMilliFec: number | null;
  client: AdminLedgerRelatedUser;
  fixer: AdminLedgerRelatedUser | null;
  payments: Array<Record<string, unknown>>;
  dispute: Record<string, unknown> | null;
  earnings: Record<string, unknown> | null;
  PlatformRevenue: Record<string, unknown> | null;
};

export type AdminLedgerRelatedDeposit = Record<string, unknown>;
export type AdminLedgerRelatedWithdrawal = Record<string, unknown> & {
  user?: AdminLedgerRelatedUser;
};
export type AdminLedgerRelatedPayment = Record<string, unknown> & {
  job?: {
    id: string;
    clientId: string;
    fixerId: string | null;
    status: string;
    priceMilliFec: number;
    lockedPriceMilliFec: number | null;
  };
};
export type AdminLedgerRelatedRevenue = Record<string, unknown>;

export type AdminLedgerUserInvestigation = {
  scope: "USER";
  entry: AdminLedgerEntryDetail;
  wallet: AdminLedgerWallet;
  user: AdminLedgerUser;
  surroundingEntries: {
    before: AdminLedgerSurroundingEntry[];
    after: AdminLedgerSurroundingEntry[];
  };
  related: {
    deposit: AdminLedgerRelatedDeposit | null;
    withdrawal: AdminLedgerRelatedWithdrawal | null;
    jobPayment: AdminLedgerRelatedPayment | null;
    job: AdminLedgerRelatedJob | null;
    earnings: Record<string, unknown> | null;
    platformRevenue: AdminLedgerRelatedRevenue | null;
  };
};

export type AdminLedgerPlatformInvestigation = {
  scope: "PLATFORM";
  entry: AdminLedgerEntryDetail;
  wallet: AdminLedgerPlatformWallet;
  surroundingEntries: {
    before: AdminLedgerSurroundingEntry[];
    after: AdminLedgerSurroundingEntry[];
  };
  related: {
    jobPayment: AdminLedgerRelatedPayment | null;
    job: AdminLedgerRelatedJob | null;
    platformRevenue: AdminLedgerRelatedRevenue | null;
  };
};

export type AdminLedgerInvestigation =
  | AdminLedgerUserInvestigation
  | AdminLedgerPlatformInvestigation;
