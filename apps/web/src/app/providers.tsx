"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { getToken } from "@/lib/auth/session";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => new QueryClient());

  // Detect system dark mode preference and apply the 'dark' class to html
  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Periodically validate the current session so logout from another device
  // is detected automatically without requiring a page refresh.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (cancelled) return;

      if (!getToken()) return;

      try {
        await apiClient.get("/auth/session");
      } catch {
        // The apiClient response interceptor handles SESSION_EXPIRED
        // and SESSION_REVOKED by clearing the session and redirecting.
      }
    }

    // Run immediately on mount.
    checkSession();

    // Continue checking every 15 seconds.
    const timer = setInterval(checkSession, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}