"use client";

import ChatMessages from "@/components/chats/ChatMessages";
import ChatInput from "@/components/chats/ChatInput";
import TypingIndicator from "@/components/chats/TypingIndicator";
import ChatRefreshButton from "@/components/chats/ChatRefreshButton";
import Card from "@/components/ui/Card";

import type { PendingChatMessage } from "@/lib/chat/types";

type Props = {
  messages: PendingChatMessage[];
  myUserId: string | null;
  typingUsers: string[];
  messageValue: string;
  canChat: boolean;
  isActive: boolean;
  role: "client" | "fixer";
  sendingMessage: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onReport: (id: string) => void;
  onMessageChange: (value: string) => void;
  onSend: () => void | Promise<void>;
};

export default function ChatConversationCard({
  messages,
  myUserId,
  typingUsers,
  messageValue,
  canChat,
  isActive,
  role,
  sendingMessage,
  isFetching,
  onRefresh,
  onReport,
  onMessageChange,
  onSend,
}: Props) {
  // ✅ Check if client has already sent at least one message
  const clientHasMessaged = messages.some(
    (m) => m.senderId !== myUserId
  );

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Messages</div>
        <ChatRefreshButton loading={isFetching} onRefresh={onRefresh} />
      </div>

      <ChatMessages messages={messages} myUserId={myUserId} onReport={onReport} />

      <TypingIndicator users={typingUsers} />

      {/* ✅ Input box logic */}
      {role === "client" ? (
        // Client always sees input box
        <ChatInput
          value={messageValue}
          disabled={!canChat}
          busy={sendingMessage}
          onChange={onMessageChange}
          onSend={onSend}
        />
      ) : (isActive || clientHasMessaged) ? (
        // Fixer sees input box only after client has messaged or chat is active
        <ChatInput
          value={messageValue}
          disabled={!canChat}
          busy={sendingMessage}
          onChange={onMessageChange}
          onSend={onSend}
        />
      ) : null}
    </Card>
  );
}
