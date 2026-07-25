// Path: apps/web/src/hooks/chat/useChatNegotiationSection.ts
"use client";

import { useMemo } from "react";

import type {
  NegotiationSectionProps,
} from "@/components/chats/ChatPageContent";

import type {
  ChatController,
} from "@/hooks/chat/useChatController";

export function useChatNegotiationSection(
  chat: ChatController
) {
  return useMemo<NegotiationSectionProps>(
    () => ({
      negotiation:
        chat.negotiation ??
        null,

      proposeFec:
        chat.proposeFec,

      lockFec:
        chat.lockFec,

      proposingPrice:
        chat.proposingPrice,

      lockingPrice:
        chat.lockingPrice,

      respondingToLockedPrice:
        chat.respondingToLockedPrice,

      onChangeProposeFec:
        chat.setProposeFec,

      onChangeLockFec:
        chat.setLockFec,

      onPropose:
        chat.handlePropose,

      onLock:
        chat.handleLock,

      onRespond:
        chat.submitLockedPriceResponse,

        myUserId:
        chat.myUserId,
    }),
    [chat]
  );
}