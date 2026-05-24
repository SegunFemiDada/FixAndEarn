"use client";

import * as React from "react";

import type {
  PendingChatMessage,
} from "@/lib/chat/types";

type Props = {
  messages: PendingChatMessage[];

  myUserId?: string | null;

  onReport?: (
    messageId: string
  ) => void;
};

function formatTime(
  value?: string
) {
  if (!value) {
    return "";
  }

  return new Date(
    value
  ).toLocaleString();
}

export default function ChatMessages({
  messages,
  myUserId,
  onReport,
}: Props) {
  const bottomRef =
    React.useRef<HTMLDivElement | null>(
      null
    );

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (
    messages.length === 0
  ) {
    return (
      <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map(
        (message) => {
          const mine =
            message.senderId ===
            myUserId;

          return (
            <div
              key={message.id}
              className={`flex ${
                mine
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  mine
                    ? "bg-[#5B8FCC] text-white"
                    : "bg-[#F4F8FF] text-[#1A2B4A] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                }`}
              >
                <div className="whitespace-pre-wrap wrap-break-word">
                  {message.body}
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 text-xs opacity-70">
                  <div className="flex items-center gap-2">
                    <span>
                      {formatTime(
                        message.createdAt
                      )}
                    </span>

                    {message.pending && (
                      <span>
                        Sending...
                      </span>
                    )}

                    {message.failed && (
                      <span className="text-red-300 dark:text-red-400">
                        Failed
                      </span>
                    )}
                  </div>

                  {!mine &&
                    onReport && (
                      <button
                        onClick={() =>
                          onReport(
                            message.id
                          )
                        }
                        className="hover:text-red-500"
                      >
                        Report
                      </button>
                    )}
                </div>
              </div>
            </div>
          );
        }
      )}

      <div ref={bottomRef} />
    </div>
  );
}