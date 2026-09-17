// Path: apps/web/src/lib/admin/users/types.ts
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
  role?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserBankDetails = {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankCode?: string | null;
} | null;

export type AdminUserVerificationDetail = {
  id: string;
  userId: string;
  status: VerificationStatus;
  state?: string | null;
  city?: string | null;
  lga?: string | null;
  bio: string;
  skills: string;
  addressHouse: string;
  addressStreet: string;
  addressArea: string;
  nearestBusStop: string;
  instagram: string | null;
  tiktok: string | null;
  ninVerificationStatus?: "PENDING" | "VERIFIED" | "FAILED";
  ninVerifiedAt?: string | null;
  ninVerifiedByAdminId?: string | null;
  ninVerificationNote?: string | null;
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
  deletionRequestStatus?: string | null;
  deletionRequestedAt?: string | null;
  deletionRequestReason?: string | null;
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

export type AdminUserInvestigationJob = {
  id: string;
  clientId: string;
  fixerId: string | null;
  skillCategory: string;
  state: string;
  city: string;
  lga: string;
  area: string;
  priceMilliFec: number;
  lockedPriceMilliFec: number | null;
  status: string;
  moderationStatus: string;
  postingType: string;
  selectedConversationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserInvestigationApplication = {
  id: string;
  jobId: string;
  fixerId: string;
  note: string | null;
  status: string;
  createdAt: string;
  job: AdminUserInvestigationJob;
};

export type AdminUserInvestigationConversation = {
  id: string;
  jobId: string;
  fixerId: string;
  status: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    clientId: string;
    fixerId: string | null;
    skillCategory: string;
    state: string;
    city: string;
    lga: string;
    area: string;
    priceMilliFec: number;
    lockedPriceMilliFec: number | null;
    status: string;
    moderationStatus: string;
    postingType: string;
  };
  _count: {
    messages: number;
    agreements: number;
  };
};

export type AdminUserInvestigationReport = {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  fixerId: string | null;
  jobId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserInvestigationDispute = {
  id: string;
  jobId: string;
  openedByUserId: string;
  reason: string;
  evidence: string | null;
  status: string;
  resolvedByAdminId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserInvestigationAuditLog = {
  id: string;
  actorAdminId: string;
  action: string;
  description: string;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
};

export type AdminUserInvestigation = {
  user: AdminUserDetail;
  jobsPosted: AdminUserInvestigationJob[];
  jobsAssigned: AdminUserInvestigationJob[];
  applications: AdminUserInvestigationApplication[];
  conversations: AdminUserInvestigationConversation[];
  reports: AdminUserInvestigationReport[];
  disputes: AdminUserInvestigationDispute[];
  auditLogs: AdminUserInvestigationAuditLog[];
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

export type DeletionRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type AdminDeletionRequest = {
  id: string;
  fullName: string;
  email: string;
  deletionRequestedAt: string;
  deletionRequestReason: string | null;
  deletionRequestStatus: DeletionRequestStatus;
};

export type AdminDeletionReviewResponse = {
  ok: true;
};