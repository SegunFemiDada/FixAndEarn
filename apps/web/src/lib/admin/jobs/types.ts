export type AdminJobStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "DRAFT";

export type AdminJobPostingType =
  | "STANDARD"
  | "URGENT";

export type AdminJobSearchParams = {
  q?: string;
  status?: AdminJobStatus;
  postingType?: AdminJobPostingType;
  clientId?: string;
  fixerId?: string;
  skip?: number;
  take?: number;
};

export type AdminJobListItem = {
  id: string;
  clientId: string;
  fixerId: string | null;
  skillCategory: string;
  state: string;
  city: string;
  lga: string | null;
  area: string | null;
  priceMilliFec: number;
  lockedPriceMilliFec: number | null;
  status: AdminJobStatus;
  postingType: AdminJobPostingType;
  selectedConversationId: string | null;
  createdAt: string;
  updatedAt: string;
  completedRequestedAt: string | null;
  completedApprovedAt: string | null;

  client: {
    id: string;
    fullName: string;
    email: string;
  };

  fixer: {
    id: string;
    fullName: string;
    email: string;
  } | null;

  _count: {
    applications: number;
    conversations: number;
    payments: number;
  };
};

export type AdminJobDetail = AdminJobListItem & {
  client: AdminJobListItem["client"] & {
    phone: string | null;
    isActive: boolean;
  };

  fixer: (AdminJobListItem["fixer"] & {
    phone: string | null;
    isActive: boolean;
  }) | null;

  images: Array<{
    id: string;
    imagePath: string;
    sortOrder: number;
    createdAt: string;
  }>;

  applications: Array<{
    id: string;
    fixerId: string;
    note: string | null;
    status: "APPLIED" | "WITHDRAWN";
    createdAt: string;
    fixer: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;

  conversations: Array<{
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
    negotiation: {
      id: string;
      status: "OPEN" | "LOCKED" | "AGREED" | "REJECTED";
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
    } | null;
    _count: {
      messages: number;
      agreements: number;
    };
  }>;

  payments: Array<{
    id: string;
    type: "POSTING" | "URGENT" | "FINAL";
    amountMilliFec: number;
    paymentFeeMilliFec: number;
    status: string;
    paymentReference: string;
    conversationId: string | null;
    fixerId: string | null;
    lockedPriceMilliFec: number | null;
    paidAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;

  completionRequest: {
    id: string;
    fixerId: string;
    status: string;
    requestedAt: string;
    reviewedByClientId: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
  } | null;

  dispute: {
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

    openedBy: {
      id: string;
      fullName: string;
      email: string;
    };

    resolvedByAdmin: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
  } | null;

  review: {
    id: string;
    clientId: string;
    fixerId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;

  earnings: {
    id: string;
    fixerId: string;
    amountMilliFec: number;
    availableMilliFec: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;

  PlatformRevenue: {
    id: string;
    grossMilliFec: number;
    platformFeeMilliFec: number;
    createdAt: string;
  } | null;
};