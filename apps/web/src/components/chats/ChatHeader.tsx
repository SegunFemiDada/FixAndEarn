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
    <div className="space-y-2">
      <Link
        href={`/app/chats`}
        className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
      >
        ← Back to chats
      </Link>

      <div className="truncate text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {participantName}
      </div>

      <div className="truncate text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
        {participantRole === "fixer" ? "Fixer" : "Client"}
      </div>
    </div>
  );
}