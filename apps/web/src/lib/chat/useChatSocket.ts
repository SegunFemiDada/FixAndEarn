//path: apps/web/src/lib/chat/useChatSocket.ts
"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type MessagePayload = {
  jobId: string;
  fixerId: string;
  conversationId: string;
  message: { id: string; senderId: string; body: string; createdAt: string };
};

export function useChatSocket(args: {
  apiBaseUrl: string;
  token: string;
  jobId: string;
  fixerId: string;
  onNewMessage: (p: MessagePayload) => void;
}) {
  const sockRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!args.token) return;

    const socket = io(`${args.apiBaseUrl}/ws/chat`, {
      transports: ["websocket"],
      auth: { token: args.token }
    });

    sockRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { jobId: args.jobId, fixerId: args.fixerId });
    });

    socket.on("message:new", (payload: MessagePayload) => {
      // Defensive: only accept matching room messages
      if (payload.jobId !== args.jobId || payload.fixerId !== args.fixerId) return;
      args.onNewMessage(payload);
    });

    return () => {
      try {
        socket.emit("leave", { jobId: args.jobId, fixerId: args.fixerId });
      } catch {}
      socket.disconnect();
      sockRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.apiBaseUrl, args.token, args.jobId, args.fixerId]);

  return { socket: sockRef.current };
}