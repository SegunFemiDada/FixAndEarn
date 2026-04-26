//path: apps/web/src/lib/admin/users/types.ts
export type UserRoleCode = "CLIENT" | "FIXER";

export type AdminSearchRole = "" | UserRoleCode;

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type UserRoleItem = {
  role: {
    code: UserRoleCode;
    name: string;
  };
};

export type UserVerificationSummary = {
  status: VerificationStatus;
  state: string | null;
  city: string | null;
  lga: string | null;
};

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
  forceReverify: boolean;
  createdAt: string;
  updatedAt: string;
  roles: UserRoleItem[];
  verification: UserVerificationSummary | null;
};

export type AdminUserDeposit = {
  id: string;
  amountMilliFec: number;
  status?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type AdminUserWithdrawal = {
  id: string;
  amountMilliFec: number;
  status?: string | null;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  paidAt?: string | null;
  reviewNote?: string | null;
};

export type AdminUserWallet = {
  id: string;
  balanceMilliFec: number;
};

export type AdminUserBankDetails = {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankCode?: string | null;
  paystackRecipientCode?: string | null;
} | null;

export type AdminUserVerificationDetail = {
  id: string;
  userId: string;
  status: VerificationStatus;
  bio: string;
  skills: string;
  addressHouse: string;
  addressStreet: string;
  addressArea: string;
  nearestBusStop: string;
  lga: string;
  city: string;
  state: string;
  instagram: string | null;
  tiktok: string | null;
  ninImagePath?: string | null;
  selfieImagePath?: string | null;
  utilityBillPath?: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedByAdminId: string | null;
  reviewedAt: string | null;
  reviewReason: string | null;
};

export type AdminUserDetail = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
  forceReverify: boolean;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  roles: UserRoleItem[];
  verification: AdminUserVerificationDetail | null;
  wallet: AdminUserWallet | null;
  bankDetails: AdminUserBankDetails;
  deposits: AdminUserDeposit[];
  withdrawals: AdminUserWithdrawal[];
};

export type SearchUsersParams = {
  q?: string;
  role?: UserRoleCode;
  verificationStatus?: VerificationStatus;
  skip?: number;
  take?: number;
};

export type AdminUserActionPayload = {
  reason?: string;
  notes?: string;
};

export type AdminUserActionResponse = {
  ok: true;
};