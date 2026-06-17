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

  const state = useMemo(() => {
    return buildChatConversationState({
      data: query.data as ConversationDetailData | undefined,
      error: query.error,
      isError: query.isError,
    });
  }, [query.data, query.error, query.isError]);

  const {
    messages,
    addRealtimeMessage,
    addOptimisticMessage,
    replacePendingMessage,
    markFailedMessage,
  } = useChatMessages(state.messages ?? []);

  // Auto‑wire realtime socket
  useChatRealtime({
    jobId,
    fixerId,
    enabled,
    refetch: query.refetch,
    addRealtimeMessage,
  });

  return {
    ...state,

    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,

    messages,
    addRealtimeMessage,
    addOptimisticMessage,
    replacePendingMessage,
    markFailedMessage,

    refreshConversation: query.refetch,
  };
}
