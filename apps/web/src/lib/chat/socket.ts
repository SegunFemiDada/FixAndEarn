//path: apps/web/src/lib/chat/socket.ts
"use client";

import { io, type Socket } from "socket.io-client";

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return base;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("fa_jwt");
}

export function connectChatSocket(): Socket {
  const baseURL = getApiBaseUrl();
  const token = getToken();

  if (!token) {
    throw new Error("Missing auth token (fa_jwt). User must be logged in.");
  }

  // IMPORTANT: backend gateway is namespace "/ws/chat"
  return io(`${baseURL}/ws/chat`, {
    transports: ["websocket"],
    auth: { token }
  });
}