// Path: apps/web/src/app/app/jobs/[jobid]/chats/[fixerId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useChatController } from "@/hooks/chat/useChatController";
import { useChatPageView } from "@/hooks/chat/useChatPageView";
import { useChatConversationSection } from "@/hooks/chat/useChatConversationSection";
import { useChatNegotiationSection } from "@/hooks/chat/useChatNegotiationSection";
import { useChatPageActions } from "@/hooks/chat/useChatPageActions";
import { useChatPageStatus } from "@/hooks/chat/useChatPageStatus";

import { getToken, getActiveRole } from "@/lib/auth/session";
import { decodeJwtUserId } from "@/lib/auth/jwt";

import ChatHeader from "@/components/chats/ChatHeader";
import ChatPageContent from "@/components/chats/ChatPageContent";
import ChatPageStates from "@/components/chats/ChatPageStates";
import ChatActionError from "@/components/chats/ChatActionError";
import ChatReportModal from "@/components/chats/ChatReportModal";
import ChatPageShell from "@/components/chats/ChatPageShell";
import ChatInvalidParams from "@/components/chats/ChatInvalidParams";

export default function JobChatDetailPage() {
  const params = useParams<{ jobid?: string; fixerId?: string }>();

  const jobId = params?.jobid ?? "";
  const fixerId = params?.fixerId ?? "";

  // ✅ Get user ID and role from session
  const token = getToken();
  const myUserId = decodeJwtUserId(token) ?? "";
  const activeRole = getActiveRole();
  const role: "client" | "fixer" = activeRole === "FIXER" ? "fixer" : "client";

  const chat = useChatController({
    jobId,
    fixerId,
    myUserId,
    role,
  });

  const view = useChatPageView({ isLoading: chat.isLoading, error: chat.error });
  const status = useChatPageStatus({ jobId, fixerId, isLoading: chat.isLoading, error: chat.error });
  const actions = useChatPageActions({ chat });

  const conversationSection = useChatConversationSection(chat);
  const negotiationSection = useChatNegotiationSection(chat);

  if (status.hasInvalidParams) {
    return <ChatInvalidParams />;
  }

  return (
    <ChatPageShell>
      <ChatHeader jobId={jobId} fixerId={fixerId} />

      {status.showStates && (
        <ChatPageStates
          isLoading={chat.isLoading}
          isError={status.isError}
          errorMessage={view.errorMessage ?? "Unknown error"}
        />
      )}

      {status.showContent && (
        <ChatPageContent
          job={chat.job ?? null}
          needsAgreement={chat.needsAgreement}
          conversation={{ ...conversationSection, onReport: actions.openReportModal }}
          negotiationSection={negotiationSection}
        />
      )}

      <ChatActionError error={chat.actionErr} />

      <ChatReportModal
        reportMessageId={chat.reportMessageId}
        jobId={jobId}
        fixerId={fixerId}
        onClose={actions.closeReportModal}
      />
    </ChatPageShell>
  );
}
