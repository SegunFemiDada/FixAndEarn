//paths: apps/web/src/lib/chat/socket.ts
"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectChatSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    return socket;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL;

  socket = io(baseUrl, {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 10000,
  });

  socket.on("disconnect", () => {});

  socket.on("connect_error", () => {});

  return socket;
}

export function disconnectChatSocket() {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();

  socket.disconnect();

  socket = null;
}