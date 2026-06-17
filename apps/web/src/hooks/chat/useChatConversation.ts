// Path: apps/web/src/hooks/chat/useChatConversation.ts

import { useMemo } from "react";
import { useConversationDetail } from "@/lib/chat/queries";
import type { ConversationDetailData } from "@/lib/chat/types";
import { buildChatConversationState } from "@/lib/chat/transformers";
import { useChatMessages } from "./useChatMessages";
import { useChatRealtime } from "./useChatRealtime";

export function useChatConversation({
  jobId,
  fixerId,
  enabled = true,
}: {
  jobId: string;
  fixerId: string;
  enabled?: boolean;
}) {
  const query = useConversationDetail(jobId, fixerId);

  // Build base state from backend data
  const state = useMemo(() => {
    return buildChatConversationState({
      data: query.data as ConversationDetailData | undefined,
      error: query.error,
      isError: query.isError,
    });
  }, [query.data, query.error, query.isError]);

  // Local message state management
  const {
    messages,
    addRealtimeMessage,
    addOptimisticMessage,
    replacePendingMessage,
    markFailedMessage,
  } = useChatMessages(state.messages ?? []);

  // Auto‑wire realtime socket for updates
  useChatRealtime({
    jobId,
    fixerId,
    enabled,
    refetch: query.refetch,
    addRealtimeMessage,
  });

  return {
    ...state,

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,

    // Message handlers
    messages,
    addRealtimeMessage,
    addOptimisticMessage,
    replacePendingMessage,
    markFailedMessage,

    // Refresh conversation manually
    refreshConversation: query.refetch,

    // NEW: conversation active flag (safe fallback)
    isActive:
      state.active ??
      (query.data as ConversationDetailData | undefined)?.conversation?.active ??
      false,
  };
}
