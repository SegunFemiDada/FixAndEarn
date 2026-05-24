// Path: apps/web/src/components/chats/ChatAgreementSection.tsx
"use client";

import AgreementPanel from "@/components/chats/AgreementPanel";

type Props = {
  canChat: boolean;

  needsAgreement: boolean;
};

export default function ChatAgreementSection({
  canChat,
  needsAgreement,
}: Props) {
  return (
    <AgreementPanel
      canChat={
        canChat
      }
      agreementLabel={
        canChat
          ? "Accepted"
          : needsAgreement
            ? "Required"
            : "Unavailable"
      }
    />
  );
}