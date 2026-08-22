"use client";

import Link from "next/link";

type Props = {
  participantName: string;
  participantRole: "client" | "fixer";
};

export default function ChatHeader({
  participantName,
  participantRole,
}: Props) {
  return (
    <div className="rounded-2xl border border-[#C5D5EE] bg-white p-4 shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
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
        {participantRole === "fixer" ? "Fixer" : "Client"}
      </div>
    </div>
  );
}