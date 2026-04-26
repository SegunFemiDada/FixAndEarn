export type AdminMessagingConversationStatus = "OPEN" | "CLOSED";

export type AdminMessagingListParams = {
  jobId?: string;
  userId?: string;
  status?: AdminMessagingConversationStatus;
  flaggedOnly?: boolean;
  disputeLinkedOnly?: boolean;
  skip?: number;
  take?: number;
};

export type AdminMessagingConversationListItem = {
  id: string;
  jobId: string;
  fixerId: string;
  status: AdminMessagingConversationStatus;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  flaggedMessageCount: number;
  lastMessage: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
    flagCount: number;
  } | null;
  job: {
    id: string;
    clientId: string | null;
    fixerId: string | null;
    status: string;
    lockedPriceMilliFec: number | null;
  } | null;
  dispute: {
    id: string;
    status: string;
    resolutionType: string | null;
  } | null;
};

export type AdminMessagingListResponse = {
  skip: number;
  take: number;
  conversations: AdminMessagingConversationListItem[];
};

export type AdminMessagingFlag = {
  id: string;
  type: string;
  matched: string | null;
  createdAt: string;
};

export type AdminMessagingMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  flags: AdminMessagingFlag[];
};

export type AdminMessagingAgreement = {
  id: string;
  userId: string;
  acceptedAt: string;
  ip: string | null;
  userAgent: string | null;
};

export type AdminMessagingNegotiation = {
  id: string;
  status: string;
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

export type AdminMessagingParticipant = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  strikeCount: number;
} | null;

export type AdminMessagingConversationDetailResponse = {
  conversation: {
    id: string;
    jobId: string;
    fixerId: string;
    status: AdminMessagingConversationStatus;
    createdAt: string;
    updatedAt: string;
  };
  job: {
    id: string;
    clientId: string | null;
    fixerId: string | null;
    status: string;
    lockedPriceMilliFec: number | null;
  } | null;
  participants: {
    client: AdminMessagingParticipant;
    fixer: AdminMessagingParticipant;
  };
  dispute: {
    id: string;
    status: string;
    resolutionType: string | null;
    createdAt: string;
    resolvedAt: string | null;
  } | null;
  agreements: AdminMessagingAgreement[];
  negotiation: AdminMessagingNegotiation;
  messages: AdminMessagingMessage[];
};

export type AdminMessagingInterventionPayload = {
  body: string;
};

export type AdminMessagingInterventionResponse = {
  ok: true;
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
  };
};

export type AdminMessagingWarnPayload = {
  target: "CLIENT" | "FIXER" | "BOTH";
  reason?: string;
};

export type AdminMessagingWarnResponse = {
  ok: true;
  warnedUsers: Array<{
    userId: string;
    role: "CLIENT" | "FIXER";
    strikeCount: number;
  }>;
};

export type AdminMessagingRestrictPayload = {
  reason?: string;
};

export type AdminMessagingRestrictResponse = {
  ok: true;
  status: "CLOSED";
};

export type AdminMessagingUserActionPayload = {
  reason?: string;
};

export type AdminMessagingUserStrikeResponse = {
  ok: true;
  userId: string;
  strikeCount: number;
};

export type AdminMessagingUserSuspendResponse = {
  ok: true;
  userId: string;
  isActive: boolean;
};