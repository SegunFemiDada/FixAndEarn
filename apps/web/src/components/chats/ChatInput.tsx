//path: apps/web/src/components/chats/ChatInput.tsx
"use client";

import Button from "@/components/ui/Button";

type Props = {
  value: string;

  disabled: boolean;

  busy: boolean;

  onChange: (
    value: string
  ) => void;

  onSend: () => void;
};

export default function ChatInput({
  value,
  disabled,
  busy,
  onChange,
  onSend,
}: Props) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          disabled
            ? "Chat unavailable"
            : "Type a message..."
        }
        disabled={
          disabled ||
          busy
        }
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey
          ) {
            e.preventDefault();

            onSend();
          }
        }}
        className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
      />

      <Button
        onClick={onSend}
        disabled={
          disabled ||
          busy ||
          !value.trim()
        }
      >
        {busy
          ? "Sending..."
          : "Send"}
      </Button>
    </div>
  );
}