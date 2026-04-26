export type DisputeStatus = "OPEN" | "RESOLVED";

export type DisputeResolutionType =
  | "RELEASE_TO_FIXER"
  | "REFUND_TO_CLIENT"
  | "PARTIAL_SPLIT";

export type AdminDisputeJob = {
  id: string;
  clientId: string | null;
  fixerId: string | null;
  status: string;
  lockedPriceMilliFec: number | null;
};

export type AdminDisputeItem = {
  id: string;
  jobId: string;
  openedByUserId: string;
  reason: string;
  evidence: unknown;
  status: DisputeStatus;
  resolutionType: DisputeResolutionType | null;
  resolvedByAdminId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  job: AdminDisputeJob | null;
};

export type ListAdminDisputesParams = {
  status?: DisputeStatus;
  jobId?: string;
};

export type ListAdminDisputesResponse = {
  disputes: AdminDisputeItem[];
};

export type ResolveDisputePayload = {
  resolutionType: DisputeResolutionType;
};

export type ResolveDisputeResponse = {
  ok: true;
  status: "RESOLVED";
  resolutionType?: DisputeResolutionType;
  mode?: "AMICABLE";
};

export type AdminDisputeChatFlag = {
  id: string;
  type: string;
  matched?: string | null;
  createdAt: string;
};

export type AdminDisputeChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  flags: AdminDisputeChatFlag[];
};

export type AdminDisputeChatConversation = {
  id: string;
  jobId: string;
  fixerId: string;
  status: "OPEN" | "CLOSED" | string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDisputeChatResponse = {
  dispute: {
    id: string;
    jobId: string;
  };
  conversation: AdminDisputeChatConversation | null;
  messages: AdminDisputeChatMessage[];
};

export type AdminDisputeChatMessagePayload = {
  body: string;
};

export type AdminDisputeChatMessageResponse = {
  ok: true;
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
  };
};