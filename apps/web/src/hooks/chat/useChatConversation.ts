//path: apps/web/src/hooks/chat/useChatConversation.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useConversationDetail } from "@/lib/chat/queries";
import type { ConversationDetailData } from "@/lib/chat/types";
import { buildChatConversationState } from "@/lib/chat/transformers";
import { useChatMessages } from "./useChatMessages";

export function useChatConversation({
  jobId,
  fixerId,
  myUserId,        // NEW
  role,
}: {
  jobId: string;
  fixerId: string;
  myUserId: string;
  role: "client" | "fixer";
  enabled?: boolean;
}) {
  const query = useConversationDetail(jobId, fixerId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

const previousStatus = useRef<string | null>(null);

  const state = useMemo(() => {
    return buildChatConversationState({
      data: query.data as ConversationDetailData | undefined,
      error: query.error,
      isError: query.isError,
    });
  }, [query.data, query.error, query.isError]);
  
useEffect(() => {
  const currentStatus = state.job?.status;
  const selectedFixerId = (state.job as { fixerId?: string | null } | null)?.fixerId;

  const isSelectedFixer =
    role === "fixer" &&
    Boolean(myUserId) &&
    selectedFixerId === myUserId;

  if (
    isSelectedFixer &&
    previousStatus.current === "OPEN" &&
    currentStatus === "IN_PROGRESS"
  ) {
    setShowPaymentModal(true);
  }

  previousStatus.current = currentStatus ?? null;
}, [role, myUserId, state.job?.status, state.job]);


  const {
    messages,
    addRealtimeMessage,
    addOptimisticMessage,
    replacePendingMessage,
    markFailedMessage,
  } = useChatMessages(state.messages ?? []);

  const paymentPendingForClient =
  role === "client" &&
  state.negotiation?.status === "AGREED" &&
  state.job?.status === "OPEN";


  return {
    ...state,
    conversationId:
    (query.data as ConversationDetailData | undefined)?.conversation?.id ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    messages,
    addRealtimeMessage,
    addOptimisticMessage,
    replacePendingMessage,
    markFailedMessage,
    refreshConversation: query.refetch,
    isActive:
      state.active ??
      (query.data as ConversationDetailData | undefined)?.conversation?.active ??
      false,
    role,              // expose role
    myUserId,          // expose myUserId
    paymentPendingForClient,
    showPaymentModal,
    dismissPaymentModal: () => {
    setShowPaymentModal(false);
},
  };
}
