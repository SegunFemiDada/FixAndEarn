// Path: apps/web/src/lib/chat/types.ts

export type ChatFlag = {
  id?: string;
  type: string;
};

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  flags?: ChatFlag[];

  clientTempId?: string;
  pending?: boolean;
};

export type Negotiation = {
  id: string;
  status: "OPEN" | "LOCKED" | "REJECTED" | "AGREED";
  proposedPriceMilliFec?: number | null;
  lockedPriceMilliFec?: number | null;
  // ✅ Add this field
  lockedByUserId?: string | null;
};


export type ChatParticipant = {
  id?: string;
  fullName?: string;
  isActive?: boolean;
};

export type ChatJob = {
  id?: string;
  status?: string;
  skillCategory?: string;
  city?: string;
  state?: string;
  lga?: string;
  area?: string;

  priceMilliFec?: number | null;
  lockedPriceMilliFec?: number | null;
};

export type ConversationDetailData = {
  conversation?: {
    id?: string;
    status?: string;
    active?: boolean; // NEW FIELD
  };

  job?: ChatJob;
  client?: ChatParticipant;
  fixer?: ChatParticipant;

  negotiation?: Negotiation;

  messages?: ChatMessage[];
};

export type PendingChatMessage = ChatMessage & {
  pending?: boolean;
  failed?: boolean;
};
