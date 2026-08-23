//path: apps/web/src/components/chats/ChatConversationCard.tsx
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

      {canChat && (
      <TypingIndicator users={typingUsers} />
    )}

      {/* ✅ Input box logic */}
      {canChat ? (
  role === "client" ? (
    // Client can always start the conversation while the conversation is open.
    <ChatInput
      value={messageValue}
      disabled={sendingMessage}
      busy={sendingMessage}
      onChange={onMessageChange}
      onSend={onSend}
    />
  ) : (
    // Fixer gets the input only after the client has activated the conversation.
    (isActive || clientHasMessaged) && (
      <ChatInput
        value={messageValue}
        disabled={sendingMessage}
        busy={sendingMessage}
        onChange={onMessageChange}
        onSend={onSend}
      />
    )
  )
) : (
  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
      This chat has been closed.
    </p>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      No further messages can be sent in this conversation.
    </p>
  </div>
)}
    </Card>
  );
}
