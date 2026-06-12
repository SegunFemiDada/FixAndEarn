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

  console.log(
    "[CHAT] connecting to",
    baseUrl
  );

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

  socket.on(
    "connect",
    () => {
      console.log(
        "[CHAT] connected",
        socket?.id
      );
    }
  );

  socket.on(
    "disconnect",
    (reason) => {
      console.log(
        "[CHAT] disconnected",
        reason
      );
    }
  );

  socket.on(
    "connect_error",
    (err) => {
      console.error(
        "[CHAT] connect_error",
        err
      );
    }
  );

  return socket;
}

export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}