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

  showPaymentModal: boolean;

  onClosePaymentModal: () => void;

  onRefresh: () => void;
};

export default function ChatPageContent({
  job,
  needsAgreement,
  conversation,
  negotiationSection,
  showPaymentModal,
  onClosePaymentModal,
  onRefresh,
}: Props)
{
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
        {showPaymentModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E2A3A] p-6 shadow-xl">

      <h3 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        Payment Received
      </h3>

      <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        The client has completed the final payment.
        This job is now officially in progress.
        You may begin work.
      </p>

      <button
        type="button"
        onClick={() => {
          onClosePaymentModal();
          onRefresh();
        }}
        className="mt-6 w-full rounded-xl bg-[#5B8FCC] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4A7BB5]"
      >
        OK
      </button>

    </div>
  </div>
)}
    </>
  );
}
