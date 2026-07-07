//path: apps/web/src/lib/chat/socket.ts
"use client";

import {
  io,
  type Socket,
} from "socket.io-client";

let socket: Socket | null =
  null;

export function connectChatSocket(): Socket {
  if (socket) {
    return socket;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined"
    );
  }

  socket = io(baseUrl, {
    transports: [
      "websocket",
      "polling",
    ],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });


  return socket;
}

export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}