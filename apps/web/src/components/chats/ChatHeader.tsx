"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  participantName: string;
  participantRole: "client" | "fixer";
  chatOpen: boolean;
  closingChat: boolean;
  onCloseChat: () => void | Promise<void>;
};

export default function ChatHeader({
  participantName,
  participantRole,
  chatOpen,
  closingChat,
  onCloseChat,
}: Props) {
  const [confirmingClose, setConfirmingClose] =
    useState(false);

  const handleClose = async () => {
    setConfirmingClose(false);
    await onCloseChat();
  };

  return (
    <div className="rounded-2xl border border-[#C5D5EE] bg-white p-4 shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/app/chats"
            className="inline-flex items-center text-sm font-semibold text-[#4A7BB5] transition-colors hover:text-[#1A2B4A] hover:underline dark:text-[#8DB8E8] dark:hover:text-[#E8F0FA]"
          >
            ← Back to chats
          </Link>

          <div className="mt-3 truncate text-base font-bold text-[#1A2B4A] dark:text-[#E8F0FA]">
            {participantName}
          </div>

          <div className="mt-1 truncate text-sm font-medium text-[#526987] dark:text-[#B7C6D9]">
            {participantRole === "fixer"
              ? "Fixer"
              : "Client"}
          </div>
        </div>

        {chatOpen && (
          <button
            type="button"
            onClick={() => setConfirmingClose(true)}
            disabled={closingChat}
            className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            {closingChat
              ? "Closing..."
              : "Close Chat"}
          </button>
        )}
      </div>

      {!chatOpen && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
          This chat is closed. 
        </div>
      )}

      {confirmingClose && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
          <div className="text-sm font-semibold text-red-800 dark:text-red-200">
            Close this chat?
          </div>

          <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-300">
            Closing the chat will prevent both participants
            from sending new messages. Previous messages
            will remain available for reference.
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() =>
                setConfirmingClose(false)
              }
              disabled={closingChat}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={closingChat}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {closingChat
                ? "Closing..."
                : "Yes, Close Chat"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}