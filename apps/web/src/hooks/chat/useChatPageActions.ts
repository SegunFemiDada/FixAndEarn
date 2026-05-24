// Path: apps/web/src/hooks/chat/useChatPageActions.ts
"use client";

import {
  useCallback,
} from "react";

import type {
  ChatController,
} from "@/hooks/chat/useChatController";

type Props = {
  chat: ChatController;
};

export function useChatPageActions({
  chat,
}: Props) {
  const openReportModal =
    useCallback(
      (
        id: string
      ) => {
        chat.setReportMessageId(
          id
        );
      },
      [chat]
    );

  const closeReportModal =
    useCallback(
      () => {
        chat.setReportMessageId(
          null
        );
      },
      [chat]
    );

  return {
    openReportModal,

    closeReportModal,
  };
}