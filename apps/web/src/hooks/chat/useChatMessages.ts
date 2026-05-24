//paths: apps/web/src/hooks/chat/useChatMessages.ts
"use client";

import * as React from "react";

import type {
  ChatMessage,
  PendingChatMessage,
} from "@/lib/chat/types";

export function useChatMessages(
  initialMessages: ChatMessage[]
) {
  const [
    messages,
    setMessages,
  ] = React.useState<
    PendingChatMessage[]
  >(initialMessages);

  const addRealtimeMessage = (
    message: ChatMessage
  ) => {
    setMessages((prev) => {
      const exists = prev.some(
        (m) =>
          m.id === message.id
      );

      if (exists) {
        return prev;
      }

      const withoutPending =
        prev.filter(
          (m) =>
            !(
              m.pending &&
              m.senderId ===
                message.senderId &&
              m.body.trim() ===
                message.body.trim()
            )
        );

      return [
        ...withoutPending,
        message,
      ];
    });
  };

  const addOptimisticMessage = (
    message: PendingChatMessage
  ) => {
    setMessages((prev) => [
      ...prev,
      message,
    ]);
  };

  const markFailedMessage = (
    tempId: string
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId
          ? {
              ...m,
              pending: false,
              failed: true,
            }
          : m
      )
    );
  };

  const replacePendingMessage = (
    tempId: string,
    realMessage: ChatMessage
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId
          ? realMessage
          : m
      )
    );
  };

  return {
    messages,
    addRealtimeMessage,
    addOptimisticMessage,
    replacePendingMessage,
    markFailedMessage,
  };
}