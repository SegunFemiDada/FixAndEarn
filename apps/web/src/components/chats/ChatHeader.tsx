//path: apps/web/src/components/chats/ChatHeader.tsx
"use client";

import Link from "next/link";

type Props = {
  jobId: string;

  fixerId: string;
};

export default function ChatHeader({
  jobId,
  fixerId,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        href={`/app/jobs/${jobId}/chats`}
        className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
      >
        ← Back to chats
      </Link>

      <div className="truncate text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
        Fixer:{" "}
        {fixerId}
      </div>
    </div>
  );
}