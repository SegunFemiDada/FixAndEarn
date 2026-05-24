// Path: apps/web/src/components/chats/ChatReportModal.tsx
"use client";

import ReportMessageModal from "@/components/chats/ReportMessageModal";

type Props = {
  reportMessageId: string | null;

  jobId: string;

  fixerId: string;

  onClose: () => void;
};

export default function ChatReportModal({
  reportMessageId,
  jobId,
  fixerId,
  onClose,
}: Props) {
  return (
    <ReportMessageModal
      messageId={
        reportMessageId ??
        ""
      }
      jobId={jobId}
      fixerId={fixerId}
      open={Boolean(
        reportMessageId
      )}
      onClose={onClose}
    />
  );
}