"use client";

import { useCallback, useEffect } from "react";

import { useTypingIndicator } from "@/hooks/chat/useTypingIndicator";
import { useChatRealtime } from "@/hooks/chat/useChatRealtime";
import { useChatActions } from "@/hooks/chat/useChatActions";
import { useChatPageState } from "@/hooks/chat/useChatPageState";
import { useChatConversation } from "@/hooks/chat/useChatConversation";
import { useChatMessages } from "@/hooks/chat/useChatMessages";

type Props = {
  jobId: string;
  fixerId: string;
  myUserId: string;              // NEW
  role: "client" | "fixer";      // NEW
};

export type ChatController = ReturnType<typeof useChatController>;

export function useChatController({
  jobId,
  fixerId,
  myUserId,
  role,
}: Props) {
  const conversation = useChatConversation({
    jobId,
    fixerId,
    myUserId,   // FIX: pass down
    role,       // FIX: pass down
  });

  const {
    messages,
    addRealtimeMessage,
    addOptimisticMessage,
    markFailedMessage,
  } = useChatMessages(conversation.messages);

  const state = useChatPageState({
    job: conversation.job ?? null,
  });

  const { typingUsers, emitTyping } = useTypingIndicator({
    jobId,
    fixerId,
    enabled: conversation.canChat,
  });

  const actions = useChatActions({
    jobId,
    fixerId,
    myUserId,
    refetch: conversation.refetch,
    addOptimisticMessage,
    markFailedMessage,
  });

  useChatRealtime({
    jobId,
    fixerId,
    enabled: Boolean(jobId && fixerId && conversation.canChat),
    myUserId,             // FIX: pass down
    addRealtimeMessage,
    refetch: conversation.refetch,
  });

  const { canChat, isCompleted } = conversation;
  const { msg, setMsg, proposeFec, lockFec } = state;
  const { setActionErr, sendChatMessage, submitProposePrice, submitLockPrice } = actions;

  useEffect(() => {
    setActionErr(null);
  }, [jobId, fixerId, setActionErr]);

  const handleSend = useCallback(async () => {
    const body = msg.trim();
    if (!body || !canChat || isCompleted) return;

    await sendChatMessage(body);
    setMsg("");
  }, [msg, setMsg, canChat, isCompleted, sendChatMessage]);

  const handleMessageChange = useCallback((value: string) => {
    setMsg(value);
    emitTyping();
  }, [setMsg, emitTyping]);

  const handlePropose = useCallback(() => {
    return submitProposePrice(Number(proposeFec) * 1000);
  }, [proposeFec, submitProposePrice]);

  const handleLock = useCallback(() => {
    return submitLockPrice(Number(lockFec) * 1000);
  }, [lockFec, submitLockPrice]);

  return {
    ...conversation,
    ...state,
    ...actions,
    messages,
    typingUsers,
    role,          // expose role
    myUserId,      // expose myUserId
    handleSend,
    handleMessageChange,
    handlePropose,
    handleLock,
  };
}
