// Path: apps/web/src/app/app/jobs/[jobid]/chats/[fixerId]/page.tsx
"use client";

import { useParams } from "next/navigation";

import { useChatController } from "@/hooks/chat/useChatController";

import { useChatPageView } from "@/hooks/chat/useChatPageView";

import { useChatConversationSection } from "@/hooks/chat/useChatConversationSection";

import { useChatNegotiationSection } from "@/hooks/chat/useChatNegotiationSection";

import { useChatPageActions } from "@/hooks/chat/useChatPageActions";

import { useChatPageStatus } from "@/hooks/chat/useChatPageStatus";

import ChatHeader from "@/components/chats/ChatHeader";

import ChatPageContent from "@/components/chats/ChatPageContent";

import ChatPageStates from "@/components/chats/ChatPageStates";

import ChatActionError from "@/components/chats/ChatActionError";

import ChatReportModal from "@/components/chats/ChatReportModal";

import ChatPageShell from "@/components/chats/ChatPageShell";

import ChatInvalidParams from "@/components/chats/ChatInvalidParams";

export default function JobChatDetailPage() {
  const params =
    useParams<{
      jobid?: string;
      fixerId?: string;
    }>();

  const jobId =
    params?.jobid ?? "";

  const fixerId =
    params?.fixerId ?? "";

  const chat =
    useChatController({
      jobId,
      fixerId,
    });

  const view =
    useChatPageView({
      isLoading:
        chat.isLoading,

      error:
        chat.error,

      showAgreementBootstrap:
        chat.showAgreementBootstrap,
    });

  const status =
    useChatPageStatus({
      jobId,

      fixerId,

      isLoading:
        chat.isLoading,

      error:
        chat.error,

      showAgreementBootstrap:
        chat.showAgreementBootstrap,
    });

  const actions =
    useChatPageActions({
      chat,
    });

  const conversationSection =
    useChatConversationSection(
      chat
    );

  const negotiationSection =
    useChatNegotiationSection(
      chat
    );

  if (
    status.hasInvalidParams
  ) {
    return (
      <ChatInvalidParams />
    );
  }

  return (
    <ChatPageShell>
      <ChatHeader
        jobId={jobId}
        fixerId={fixerId}
      />

      {status.showStates && (
        <ChatPageStates
          isLoading={
            chat.isLoading
          }
          isError={
            status.isError
          }
          showAgreementBootstrap={
            view.showAgreementBootstrap
          }
          errorMessage={
            view.errorMessage ??
            "Unknown error"
          }
          isConversationMissing={Boolean(
            chat.isConversationMissing
          )}
          agreementBusy={
            chat.agreementBusy
          }
          onAcceptAgreement={
            chat.submitAgreement
          }
        />
      )}

      {status.showContent && (
        <ChatPageContent
          job={
            chat.job ?? null
          }
          needsAgreement={
            chat.needsAgreement
          }
          conversation={{
            ...conversationSection,

            onReport:
              actions.openReportModal,
          }}
          negotiationSection={
            negotiationSection
          }
        />
      )}

      <ChatActionError
        error={
          chat.actionErr
        }
      />

      <ChatReportModal
        reportMessageId={
          chat.reportMessageId
        }
        jobId={jobId}
        fixerId={fixerId}
        onClose={
          actions.closeReportModal
        }
      />
    </ChatPageShell>
  );
}