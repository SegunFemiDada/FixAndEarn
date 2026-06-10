// Path: apps/web/src/components/chats/ChatPageStates.tsx
"use client";

import ChatErrorCard from "@/components/chats/ChatErrorCard";
import ChatLoadingCard from "@/components/chats/ChatLoadingCard";

type Props = {
  isLoading: boolean;

  isError: boolean;

  errorMessage: string;
};

export default function ChatPageStates({
  isLoading,
  isError,
  errorMessage,
}: Props) {
  if (isLoading) {
    return (
      <ChatLoadingCard />
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