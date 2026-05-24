//paths: apps/web/src/hooks/chat/useChatRealtime.ts
"use client";

import { useEffect, useRef } from "react";

import type { Socket } from "socket.io-client";

import { connectChatSocket } from "@/lib/chat/socket";

import type {
  ChatMessage,
} from "@/lib/chat/types";

type Params = {
  jobId: string;
  fixerId: string;
  enabled: boolean;

  addRealtimeMessage: (
    message: ChatMessage
  ) => void;

  refetch: () => Promise<any>;
};

export function useChatRealtime({
  jobId,
  fixerId,
  enabled,
  refetch,
  addRealtimeMessage,
}: Params) {
  const socketRef =
    useRef<Socket | null>(
      null
    );

  const reconnectTimerRef =
    useRef<NodeJS.Timeout | null>(
      null
    );

  useEffect(() => {
    if (
      !enabled ||
      !jobId ||
      !fixerId
    ) {
      return;
    }

    let unmounted = false;

    const socket =
      connectChatSocket();

    socketRef.current =
      socket;

    const joinRoom = () => {
      socket.emit("join", {
        jobId,
        fixerId,
      });
    };

    socket.on(
      "connect",
      joinRoom
    );

    socket.on(
      "reconnect",
      joinRoom
    );

    socket.on(
      "message:new",
      (
      payload: {
        jobId?: string;
        fixerId?: string;
        message?: ChatMessage;
      }
    ) => {
        if (unmounted) {
          return;
        }

        if (
          payload?.jobId !==
          jobId
        ) {
          return;
        }

        if (
          payload?.fixerId !==
          fixerId
        ) {
          return;
        }

        const message =
          payload?.message;

        if (
          !message?.id
        ) {
          return;
        }

        addRealtimeMessage({
          ...message,
          flags:
            Array.isArray(
              message.flags
            )
              ? message.flags
              : [],
        });
      }
    );

    socket.on(
      "negotiation:update",
       () => {
        if (unmounted) {
          return;
        }

        refetch();
      }
    );

    socket.on(
      "agreement:update",
       () => {
        if (unmounted) {
          return;
        }

        refetch();
      }
    );

    socket.on(
      "job:update",
      async () => {
        if (unmounted) {
          return;
        }

        await refetch();
      }
    );

    socket.on(
      "connect_error",
      () => {
        if (
          reconnectTimerRef.current
        ) {
          clearTimeout(
            reconnectTimerRef.current
          );
        }

        reconnectTimerRef.current =
          setTimeout(() => {
            try {
              socket.connect();
            } catch {}
          }, 3000);
      }
    );

    joinRoom();

    return () => {
      unmounted = true;

      if (
        reconnectTimerRef.current
      ) {
        clearTimeout(
          reconnectTimerRef.current
        );
      }

      try {
        socket.emit(
          "leave",
          {
            jobId,
            fixerId,
          }
        );
      } catch {}

      socket.removeAllListeners();

      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [
    enabled,
    fixerId,
    jobId,
    refetch,
    addRealtimeMessage,
  ]);
}