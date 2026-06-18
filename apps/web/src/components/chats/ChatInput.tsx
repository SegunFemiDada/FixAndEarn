"use client";

import Button from "@/components/ui/Button";

type Props = {
  value: string;
  disabled: boolean; // true if chat not active or busy
  busy: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export default function ChatInput({
  value,
  disabled,
  busy,
  onChange,
  onSend,
}: Props) {
  if (disabled) {
    // Show a clear message instead of input when chat is not active
    return (
      <div className="flex items-center justify-center w-full py-3 text-sm text-gray-500 dark:text-gray-400">
        Waiting for client to start chat…
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
        disabled={busy}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
      />

      <Button
        onClick={onSend}
        disabled={busy || !value.trim()}
      >
        {busy ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}
