// Path: apps/web/src/components/chats/ChatActionError.tsx
"use client";

import ChatErrorCard from "@/components/chats/ChatErrorCard";

type Props = {
  error: string | null;
};

export default function ChatActionError({
  error,
}: Props) {
  if (!error) {
    return null;
  }

  return (
    <ChatErrorCard
      title="Action failed"
      message={error}
    />
  );
}