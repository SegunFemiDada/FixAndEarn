//path: apps/web/src/hooks/chat/useChatRealtime.ts
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

    const safeRefetch =
      async () => {
        if (unmounted) {
          return;
        }

        try {
          await refetch();
        } catch {}
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
        console.log(
        "[CHAT EVENT RECEIVED]",
        payload
      );
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

        safeRefetch();
      }
    );

    socket.on(
      "negotiation:update",
      safeRefetch
    );

    socket.on(
      "agreement:update",
      safeRefetch
    );

    socket.on(
      "job:update",
      safeRefetch
    );

    socket.on(
      "negotiation:proposed",
      safeRefetch
    );

    socket.on(
      "negotiation:locked",
      safeRefetch
    );

    socket.on(
      "negotiation:response",
      safeRefetch
    );

    socket.on(
      "negotiation:agreed",
      safeRefetch
    );

    socket.on(
      "job:status",
      safeRefetch
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

      socket.off("connect", joinRoom);
socket.off("reconnect", joinRoom);

socket.off("message:new");
socket.off("negotiation:update");
socket.off("agreement:update");
socket.off("job:update");
socket.off("negotiation:proposed");
socket.off("negotiation:locked");
socket.off("negotiation:response");
socket.off("negotiation:agreed");
socket.off("job:status");

socketRef.current = null;
    };
  }, [
    enabled,
    fixerId,
    jobId,
    refetch,
    addRealtimeMessage,
  ]);
}