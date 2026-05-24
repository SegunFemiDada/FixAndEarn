// Path: apps/web/src/components/chats/ChatPageStates.tsx
"use client";

import ChatErrorCard from "@/components/chats/ChatErrorCard";
import ChatLoadingCard from "@/components/chats/ChatLoadingCard";
import AgreementBootstrapCard from "@/components/chats/AgreementBootstrapCard";

type Props = {
  isLoading: boolean;

  isError: boolean;

  showAgreementBootstrap: boolean;

  errorMessage: string;

  isConversationMissing: boolean;

  agreementBusy: boolean;

  onAcceptAgreement: () => void;
};

export default function ChatPageStates({
  isLoading,
  isError,
  showAgreementBootstrap,
  errorMessage,
  isConversationMissing,
  agreementBusy,
  onAcceptAgreement,
}: Props) {
  if (isLoading) {
    return <ChatLoadingCard />;
  }

  if (showAgreementBootstrap) {
    return (
      <AgreementBootstrapCard
        isConversationMissing={
          isConversationMissing
        }
        agreementBusy={
          agreementBusy
        }
        onAccept={
          onAcceptAgreement
        }
      />
    );
  }

  if (isError) {
    return (
      <ChatErrorCard
        title="Chat Closed"
        message={
          errorMessage
        }
      />
    );
  }

  return null;
}