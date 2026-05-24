// Path: apps/web/src/hooks/chat/useChatConversation.ts

import { useMemo } from "react";
import { useConversationDetail } from "@/lib/chat/queries";
import type { ConversationDetailData } from "@/lib/chat/types";
import { buildChatConversationState } from "@/lib/chat/transformers";

export function useChatConversation({
  jobId,
  fixerId,
}: {
  jobId: string;
  fixerId: string;
}) {
  const query = useConversationDetail(jobId, fixerId);

  const state = useMemo(() => {
    return buildChatConversationState({
      data: query.data as ConversationDetailData | undefined,
      error: query.error,
      isError: query.isError,
    });
  }, [query.data, query.error, query.isError]);

  return {
    ...state,

    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,

    addRealtimeMessage: () => {},
    addOptimisticMessage: () => {},
    markFailedMessage: () => {},

    refreshConversation: query.refetch,
  };
}