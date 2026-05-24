// Path: apps/web/src/types/chat-page.ts

import type {
  ChatJob,
  ChatMessage,
  Negotiation,
} from "@/lib/chat/types";

export type ChatConversationSectionProps =
  {
    messages: ChatMessage[];

    myUserId: string | null;

    typingUsers: string[];

    messageValue: string;

    canChat: boolean;

    sendingMessage: boolean;

    isFetching: boolean;

    onRefresh: () => void;

    onReport: (
      id: string
    ) => void;

    onMessageChange: (
      value: string
    ) => void;

    onSend: () => void;
  };

export type ChatNegotiationSectionProps =
  {
    negotiation: Negotiation | null;

    proposeFec: string;

    lockFec: string;

    proposingPrice: boolean;

    lockingPrice: boolean;

    respondingToLockedPrice: boolean;

    onChangeProposeFec: (
      value: string
    ) => void;

    onChangeLockFec: (
      value: string
    ) => void;

    onPropose: () => void;

    onLock: () => void;

    onRespond: (
      accepted: boolean
    ) => void;
  };

export type ChatPageContentProps =
  {
    job: ChatJob | null;

    needsAgreement: boolean;

    conversation: ChatConversationSectionProps;

    negotiationSection: ChatNegotiationSectionProps;
  };