// Path: apps/web/src/components/chats/ChatErrorCard.tsx

"use client";

import Card from "@/components/ui/Card";

type Props = {
  title?: string;
  message: string;
};

export default function ChatErrorCard({
  title = "Error",
  message,
}: Props) {
  return (
    <Card>
      <div className="font-semibold text-red-500">
        {title}
      </div>

      <pre className="mt-2 whitespace-pre-wrap text-sm">
        {message}
      </pre>
    </Card>
  );
}