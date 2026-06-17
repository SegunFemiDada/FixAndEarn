//path: apps/web/src/lib/chat/message-merge.ts
import type { ChatMessage } from "./types";

export function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
  const map = new Map<string, ChatMessage>();

  for (const msg of current) {
    map.set(msg.id, msg);
  }

  for (const msg of incoming) {
    map.set(msg.id, msg);
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );
}