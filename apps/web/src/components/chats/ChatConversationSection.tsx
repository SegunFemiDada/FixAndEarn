// Path: apps/web/src/components/chats/ChatConversationSection.tsx
"use client";

import ChatConversationCard from "@/components/chats/ChatConversationCard";

import type {
  ConversationSectionProps,
} from "@/components/chats/ChatPageContent";

export default function ChatConversationSection({
  messages,
  myUserId,
  typingUsers,
  messageValue,
  canChat,
  sendingMessage,
  isFetching,
  onRefresh,
  onReport,
  onMessageChange,
  onSend,
}: ConversationSectionProps) {
  return (
    <ChatConversationCard
      messages={messages}
      myUserId={myUserId}
      typingUsers={
        typingUsers
      }
      messageValue={
        messageValue
      }
      canChat={canChat}
      sendingMessage={
        sendingMessage
      }
      isFetching={
        isFetching
      }
      onRefresh={
        onRefresh
      }
      onReport={onReport}
      onMessageChange={
        onMessageChange
      }
      onSend={onSend}
    />
  );
}