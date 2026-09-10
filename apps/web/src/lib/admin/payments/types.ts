export type AdminPaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED";

export type AdminPaymentType =
  | "POSTING"
  | "URGENT"
  | "FINAL";

export type AdminPaymentSearchParams = {
  q?: string;
  status?: AdminPaymentStatus;
  type?: AdminPaymentType;
  jobId?: string;
  clientId?: string;
  fixerId?: string;
  skip?: number;
  take?: number;
};

export type AdminPaymentClient = {
  id: string;
  fullName: string;
  email: string;
};

export type AdminPaymentFixer = {
  id: string;
  fullName: string;
  email: string;
};

export type AdminPaymentJobList = {
  id: string;
  skillCategory: string;
  status: string;
  postingType: string;
  clientId: string;
  fixerId: string | null;

  client: AdminPaymentClient;

  fixer: AdminPaymentFixer | null;
};

export type AdminPaymentListItem = {
  id: string;
  jobId: string;

  amountMilliFec: number;
  paymentFeeMilliFec: number;

  status: AdminPaymentStatus;

  paidAt: string | null;
  expiresAt: string | null;

  createdAt: string;
  updatedAt: string;

  paymentReference: string;

  type: AdminPaymentType;

  conversationId: string | null;
  fixerId: string | null;

  lockedPriceMilliFec: number | null;

  job: AdminPaymentJobList;
};

export type AdminPaymentJobDetail = {
  id: string;

  skillCategory: string;
  description: string | null;

  state: string;
  city: string;
  lga: string | null;
  area: string | null;

  status: string;
  postingType: string;

  clientId: string;
  fixerId: string | null;

  priceMilliFec: number;
  lockedPriceMilliFec: number | null;

  selectedConversationId: string | null;

  createdAt: string;
  updatedAt: string;

  completedRequestedAt: string | null;
  completedApprovedAt: string | null;

  client: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };

  fixer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  } | null;
};

export type AdminPaymentCompletionRequest = {
  id: string;
  fixerId: string;
  status: string;

  requestedAt: string;

  reviewedByClientId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export type AdminPaymentDisputeUser = {
  id: string;
  fullName: string;
  email: string;
};

export type AdminPaymentDisputeAdmin = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export type AdminPaymentDispute = {
  id: string;

  openedByUserId: string;

  reason: string;

  evidence: unknown;

  status: string;

  resolutionType: string | null;

  resolvedByAdminId: string | null;
  resolvedAt: string | null;

  createdAt: string;
  updatedAt: string;

  openedBy: AdminPaymentDisputeUser;

  resolvedByAdmin: AdminPaymentDisputeAdmin | null;
};

export type AdminPaymentEarnings = {
  id: string;

  fixerId: string;

  amountMilliFec: number;
  availableMilliFec: number;

  status: string;

  paidAt: string | null;

  createdAt: string;
  updatedAt: string;
};

export type AdminPaymentPlatformRevenue = {
  id: string;

  grossMilliFec: number;
  platformFeeMilliFec: number;

  createdAt: string;
};

export type AdminPaymentNegotiation = {
  id: string;

  status:
    | "OPEN"
    | "LOCKED"
    | "AGREED"
    | "REJECTED";

  proposedPriceMilliFec: number | null;
  lockedPriceMilliFec: number | null;

  lockedByUserId: string | null;

  clientAcceptedAt: string | null;
  fixerAcceptedAt: string | null;

  agreedAt: string | null;

  rejectedAt: string | null;
  rejectedByUserId: string | null;

  createdAt: string;
  updatedAt: string;
};

export type AdminPaymentConversation = {
  id: string;

  fixerId: string;

  status: "OPEN" | "CLOSED";

  active: boolean;

  createdAt: string;
  updatedAt: string;

  fixer: {
    id: string;
    fullName: string;
    email: string;
  };

  negotiation: AdminPaymentNegotiation | null;

  _count: {
    messages: number;
    agreements: number;
  };
};

export type AdminPaymentJobPayment = {
  id: string;

  type: AdminPaymentType;

  amountMilliFec: number;
  paymentFeeMilliFec: number;

  status: AdminPaymentStatus;

  paymentReference: string;

  conversationId: string | null;
  fixerId: string | null;

  lockedPriceMilliFec: number | null;

  paidAt: string | null;
  expiresAt: string | null;

  createdAt: string;
  updatedAt: string;
};

export type AdminPaymentDetail = {
  id: string;

  jobId: string;

  amountMilliFec: number;
  paymentFeeMilliFec: number;

  status: AdminPaymentStatus;

  paidAt: string | null;
  expiresAt: string | null;

  createdAt: string;
  updatedAt: string;

  paymentReference: string;

  type: AdminPaymentType;

  conversationId: string | null;
  fixerId: string | null;

  lockedPriceMilliFec: number | null;

  job: AdminPaymentJobDetail;

  completionRequest: AdminPaymentCompletionRequest | null;

  dispute: AdminPaymentDispute | null;

  earnings: AdminPaymentEarnings | null;

  PlatformRevenue: AdminPaymentPlatformRevenue | null;

  conversations: AdminPaymentConversation[];
};