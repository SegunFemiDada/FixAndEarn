// Path: apps/web/src/components/chats/ChatInvalidParams.tsx
"use client";

import ChatErrorCard from "@/components/chats/ChatErrorCard";
import ChatPageShell from "@/components/chats/ChatPageShell";

export default function ChatInvalidParams() {
  return (
    <ChatPageShell>
      <ChatErrorCard
        title="Invalid URL"
        message="Missing chat parameters."
      />
    </ChatPageShell>
  );
}