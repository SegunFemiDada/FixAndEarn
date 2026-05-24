// Path: apps/web/src/hooks/chat/useTypingIndicator.ts

"use client";

import * as React from "react";

import type { Socket } from "socket.io-client";

import { connectChatSocket } from "@/lib/chat/socket";

type Params = {
  jobId: string;
  fixerId: string;
  enabled: boolean;
  myUserId?: string | null;
};

export function useTypingIndicator({
  jobId,
  fixerId,
  enabled,
  myUserId,
}: Params) {
  const [
    isTyping,
    setIsTyping,
  ] = React.useState(false);

  const [
    typingUsers,
    setTypingUsers,
  ] = React.useState<string[]>(
    []
  );

  const socketRef =
    React.useRef<Socket | null>(
      null
    );

  const timeoutRef =
    React.useRef<NodeJS.Timeout | null>(
      null
    );

  React.useEffect(() => {
    if (
      !enabled ||
      !jobId ||
      !fixerId
    ) {
      return;
    }

    const socket =
      connectChatSocket();

    socketRef.current =
      socket;

    const handleTyping = (
      payload: {
        jobId?: string;
        fixerId?: string;
        userId?: string;
        typing?: boolean;
      }
    ) => {
      if (
        payload.jobId !==
          jobId ||
        payload.fixerId !==
          fixerId
      ) {
        return;
      }

      if (
        payload.userId ===
        myUserId
      ) {
        return;
      }

      if (!payload.userId) {
        return;
      }

      setTypingUsers((prev) => {
        const exists =
          prev.includes(
            payload.userId!
          );

        if (payload.typing) {
          if (exists) {
            return prev;
          }

          return [
            ...prev,
            payload.userId!,
          ];
        }

        return prev.filter(
          (id) =>
            id !==
            payload.userId
        );
      });
    };

    socket.on(
      "typing:update",
      handleTyping
    );

    return () => {
      socket.off(
        "typing:update",
        handleTyping
      );
    };
  }, [
    enabled,
    jobId,
    fixerId,
    myUserId,
  ]);

  const emitTyping =
    React.useCallback(() => {
      if (
        !enabled ||
        !socketRef.current
      ) {
        return;
      }

      if (!isTyping) {
        setIsTyping(true);

        socketRef.current.emit(
          "typing:update",
          {
            jobId,
            fixerId,
            typing: true,
          }
        );
      }

      if (
        timeoutRef.current
      ) {
        clearTimeout(
          timeoutRef.current
        );
      }

      timeoutRef.current =
        setTimeout(() => {
          setIsTyping(false);

          socketRef.current?.emit(
            "typing:update",
            {
              jobId,
              fixerId,
              typing: false,
            }
          );
        }, 1500);
    }, [
      enabled,
      fixerId,
      jobId,
      isTyping,
    ]);

  return {
    isTyping,
    typingUsers,
    emitTyping,
  };
}