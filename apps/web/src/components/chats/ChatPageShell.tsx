// Path: apps/web/src/components/chats/ChatPageShell.tsx
"use client";

import type {
  PropsWithChildren,
} from "react";

type Props =
  PropsWithChildren;

export default function ChatPageShell({
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] px-4 py-6 dark:bg-[#111827]">
      <div className="mx-auto max-w-2xl space-y-4">
        {children}
      </div>
    </div>
  );
}