// Path: apps/web/src/lib/chat/transformers.ts

import type {
  ConversationDetailData,
  ChatMessage,
} from "@/lib/chat/types";

export type ChatConversationState = {
  job: ConversationDetailData["job"] | null;
  negotiation: ConversationDetailData["negotiation"] | null;
  messages: ChatMessage[];

  isCompleted: boolean;
  canChat: boolean;

  needsAgreement: boolean;
  isConversationMissing: boolean;
  showAgreementBootstrap: boolean;
  error: unknown | null;

  active: boolean; // NEW FIELD
};

export function buildChatConversationState(params: {
  data?: ConversationDetailData;
  error: unknown;
  isError: boolean;
}): ChatConversationState {
  const { data, error, isError } = params;

  const job = data?.job ?? null;
  const negotiation = data?.negotiation ?? null;

  const messages: ChatMessage[] = Array.isArray(data?.messages)
    ? data!.messages
    : [];

  const backendMsg = extractBackendMessage(error);

  const isConversationMissing =
    backendMsg === "CONVERSATION_NOT_FOUND" ||
    Boolean(backendMsg?.includes("CONVERSATION_NOT_FOUND"));

  const needsAgreement = false;

  const isCompleted = job?.status === "COMPLETED";

  const canChat = Boolean(data) && !isError && !isCompleted;

  const showAgreementBootstrap = false;

  return {
    job,
    negotiation,
    messages,
    isCompleted,
    canChat,
    needsAgreement,
    isConversationMissing,
    showAgreementBootstrap,
    error,
    active: data?.conversation?.active ?? false, // NEW FIELD
  };
}

// local safe extraction (no dependency risk)
function extractBackendMessage(err: unknown): string | null {
  const e = err as any;

  const msg = e?.response?.data?.message;

  if (!msg) return null;

  if (Array.isArray(msg)) return msg.join(",");

  return String(msg);
}
