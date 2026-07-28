//path: apps/web/src/hooks/chat/useChatRealtime.ts
"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { connectChatSocket } from "@/lib/chat/socket";
import type { ChatMessage } from "@/lib/chat/types";

function playSound(file: string) {
  try {
    const audio = new Audio(file);
    audio.play().catch(() => {
      console.warn("Notification sound blocked by browser policy");
    });
  } catch (err) {
    console.error("Failed to play sound", err);
  }
}

type Params = {
  jobId: string;
  fixerId: string;
  enabled: boolean;
  myUserId: string;   // NEW
  addRealtimeMessage: (message: ChatMessage) => void;
  refetch: () => Promise<any>;
};

export function useChatRealtime({
  jobId,
  fixerId,
  enabled,
  myUserId,
  refetch,
  addRealtimeMessage,
}: Params) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !jobId || !fixerId) return;

    let unmounted = false;
    const socket = connectChatSocket();
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit("join", { jobId, fixerId });
    };

    const safeRefetch = async () => {
      if (unmounted) return;
      try {
        await refetch();
      } catch {}
    };

    socket.on("conversation:activated", (payload) => {
      if (unmounted) return;
      if (payload.jobId !== jobId || payload.fixerId !== fixerId) return;
      playSound("/sounds/chat-activated.mp3");
      safeRefetch();
    });

    socket.on("message:new", (payload) => {
      if (unmounted) return;
      if (payload?.jobId !== jobId || payload?.fixerId !== fixerId) return;

      const message = payload?.message;
      if (!message?.id) return;

      addRealtimeMessage({
        ...message,
        flags: Array.isArray(message.flags) ? message.flags : [],
      });
      socket.on("job:started", (payload) => {
  if (unmounted) return;
  if (payload.jobId !== jobId) return;

  playSound("/sounds/bell.mp3");

  safeRefetch();
});

      // Only play sound if it's not my own message
      if (message.senderId !== myUserId) {
        playSound("/sounds/message.mp3");
      }

      safeRefetch();
    });

    const notificationEvents = [
      "negotiation:update",
      "agreement:update",
      "job:update",
      "negotiation:proposed",
      "negotiation:locked",
      "negotiation:response",
      "negotiation:agreed",
      "job:status",
    ];

    notificationEvents.forEach((event) => {
      socket.on(event, () => {
        playSound("/sounds/notification.mp3");
        safeRefetch();
      });
    });

    socket.on("connect", joinRoom);
    socket.on("reconnect", joinRoom);

    socket.on("connect_error", () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = setTimeout(() => {
        try {
          socket.connect();
        } catch {}
      }, 3000);
    });

    joinRoom();
  socket.on("payment:created", (payload) => {
  if (unmounted) return;


  if (payload.jobId !== jobId) {
    return;
  }

  if (payload.payerId !== myUserId) {
    return;
  }

  window.location.href = payload.authorizationUrl;
});

    return () => {
      unmounted = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      try {
        socket.emit("leave", { jobId, fixerId });
      } catch {}

      socket.off("connect", joinRoom);
      socket.off("reconnect", joinRoom);
      socket.off("conversation:activated");
      socket.off("message:new");
      socket.off("payment:created");
      socket.off("job:started");
      notificationEvents.forEach((event) => socket.off(event));

      socketRef.current = null;
    };
  }, [enabled, fixerId, jobId, refetch, addRealtimeMessage, myUserId]);
}
