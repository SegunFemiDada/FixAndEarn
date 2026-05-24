// Path: apps/web/src/components/chats/TypingIndicator.tsx

"use client";

type Props = {
  users: string[];
};

export default function TypingIndicator({
  users,
}: Props) {
  if (
    !users ||
    users.length === 0
  ) {
    return null;
  }

  const label =
    users.length === 1
      ? "Typing..."
      : "Multiple users typing...";

  return (
    <div className="px-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
      {label}
    </div>
  );
}