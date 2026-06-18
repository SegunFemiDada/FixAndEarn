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
  isActive: boolean; // NEW
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
  sendingMessage,
  isFetching,
  onRefresh,
  onReport,
  onMessageChange,
  onSend,
}: Props) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Messages</div>
        <ChatRefreshButton loading={isFetching} onRefresh={onRefresh} />
      </div>

      <ChatMessages messages={messages} myUserId={myUserId} onReport={onReport} />

      <TypingIndicator users={typingUsers} />

      <ChatInput
        value={messageValue}
        disabled={!canChat || !isActive} // FIX: input locked until client activates
        busy={sendingMessage}
        onChange={onMessageChange}
        onSend={onSend}
      />
    </Card>
  );
}
