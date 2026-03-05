//path: apps/api/src/chat/realtime/chat-realtime.service.ts
import { Injectable } from "@nestjs/common";

type EventPayload = any;

type Listener = (ev: { type: string; payload: EventPayload }) => void;

@Injectable()
export class ChatRealtimeService {
  private rooms = new Map<string, Set<Listener>>();

  roomFor(jobId: string, fixerId: string) {
    return `job:${jobId}:fixer:${fixerId}`;
  }

  subscribe(room: string, listener: Listener) {
    const set = this.rooms.get(room) ?? new Set<Listener>();
    set.add(listener);
    this.rooms.set(room, set);

    return () => {
      const cur = this.rooms.get(room);
      if (!cur) return;
      cur.delete(listener);
      if (cur.size === 0) this.rooms.delete(room);
    };
  }

  emitToRoom(room: string, type: string, payload: EventPayload) {
    const set = this.rooms.get(room);
    if (!set || set.size === 0) return;

    for (const listener of set) {
      try {
        listener({ type, payload });
      } catch {}
    }
  }
}