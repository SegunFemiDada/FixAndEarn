// Path: apps/web/src/components/chats/ChatPageContent.tsx
"use client";

import JobSummaryCard from "@/components/chats/JobSummaryCard";
import ChatAgreementSection from "@/components/chats/ChatAgreementSection";

import ChatConversationSection from "@/components/chats/ChatConversationSection";
import ChatNegotiationSectionContainer from "@/components/chats/ChatNegotiationSectionContainer";

import type {
  ChatJob,
  ChatMessage,
  Negotiation,
} from "@/lib/chat/types";

export type ConversationSectionProps = {
  messages: ChatMessage[];
  myUserId: string | null;
  typingUsers: string[];
  messageValue: string;
  canChat: boolean;
  sendingMessage: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onReport: (id: string) => void;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  role: "client" | "fixer";   // ✅ NEW
  isActive: boolean;          // ✅ NEW
};


export type NegotiationSectionProps = {
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
    myUserId: string | null;

};

type Props = {
  job: ChatJob | null;

  needsAgreement: boolean;

  conversation: ConversationSectionProps;

  negotiationSection: NegotiationSectionProps;
};

export default function ChatPageContent({
  job,
  needsAgreement,
  conversation,
  negotiationSection,
}: Props) {
  return (
    <>
      <JobSummaryCard
        job={job}
      />

      <ChatAgreementSection
        canChat={
          conversation.canChat
        }
        needsAgreement={
          needsAgreement
        }
      />

      <ChatNegotiationSectionContainer
        {...negotiationSection}
      />

      <ChatConversationSection
        {...conversation}      />
    </>
  );
}
