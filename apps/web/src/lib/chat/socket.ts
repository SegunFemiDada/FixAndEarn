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

  socket = io(
    `${baseUrl}/chat`,
    {
      withCredentials: true,
      reconnection: true,
    }
  );

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