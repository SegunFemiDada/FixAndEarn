// Path: apps/web/src/hooks/chat/useChatConversationSection.ts
"use client";

import { useMemo } from "react";

import type {
  ConversationSectionProps,
} from "@/components/chats/ChatPageContent";

import type {
  ChatController,
} from "@/hooks/chat/useChatController";

export function useChatConversationSection(
  chat: ChatController
) {
  return useMemo<ConversationSectionProps>(
    () => ({
      messages:
        chat.messages,

      myUserId:
        chat.myUserId,

      typingUsers:
        chat.typingUsers,

      messageValue:
        chat.msg,

      canChat:
        chat.canChat,

      sendingMessage:
        chat.sendingMessage,

      isFetching:
        chat.isFetching,

      onRefresh:
        chat.refreshConversation,

      onReport: (
        id: string
      ) =>
        chat.setReportMessageId(
          id
        ),

      onMessageChange:
        chat.handleMessageChange,

      onSend:
        chat.handleSend,
    }),
    [chat]
  );
}