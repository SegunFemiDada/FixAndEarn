//path: apps/web/src/components/chats/ChatConversationSection.tsx
"use client";

import ChatConversationCard from "@/components/chats/ChatConversationCard";
import type { ConversationSectionProps } from "@/components/chats/ChatPageContent";

export default function ChatConversationSection({
  messages,
  myUserId,
  typingUsers,
  messageValue,
  canChat,
  isActive,
  role,                // NEW: accept role
  sendingMessage,
  isFetching,
  onRefresh,
  onReport,
  onMessageChange,
  onSend,
}: ConversationSectionProps & { isActive: boolean; role: "client" | "fixer" }) {
  return (
    <ChatConversationCard
      messages={messages}
      myUserId={myUserId}
      typingUsers={typingUsers}
      messageValue={messageValue}
      canChat={canChat}
      role={role}                // FIX: pass role down
      isActive={isActive}
      sendingMessage={sendingMessage}
      isFetching={isFetching}
      onRefresh={onRefresh}
      onReport={onReport}
      onMessageChange={onMessageChange}
      onSend={onSend}
    />
  );
}
