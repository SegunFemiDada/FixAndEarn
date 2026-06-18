"use client";

import ChatConversationCard from "@/components/chats/ChatConversationCard";
import type { ConversationSectionProps } from "@/components/chats/ChatPageContent";

export default function ChatConversationSection({
  messages,
  myUserId,
  typingUsers,
  messageValue,
  canChat,
  isActive,          // NEW: accept isActive
  sendingMessage,
  isFetching,
  onRefresh,
  onReport,
  onMessageChange,
  onSend,
}: ConversationSectionProps & { isActive: boolean }) {   // FIX: extend props type
  return (
    <ChatConversationCard
      messages={messages}
      myUserId={myUserId}
      typingUsers={typingUsers}
      messageValue={messageValue}
      canChat={canChat}
      isActive={isActive}          // FIX: pass down
      sendingMessage={sendingMessage}
      isFetching={isFetching}
      onRefresh={onRefresh}
      onReport={onReport}
      onMessageChange={onMessageChange}
      onSend={onSend}
    />
  );
}
