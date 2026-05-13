// Path: apps/web/src/lib/admin/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import adminApi from "@/lib/admin/api";
import { clearAdminSession, saveAdminSession } from "@/lib/admin/session";
import type {
  AdminLoginInput,
  AdminLoginResponse,
  AdminMeResponse,
} from "@/lib/admin/types";

// ─── Query keys ──────────────────────────────────────────────────────────────
export const adminQueryKeys = {
  me: ["admin", "me"] as const,
};

// ─── Error extraction ────────────────────────────────────────────────────────
// Single definition — imported by the login page via:
//   import { extractApiErrorMessage } from "@/lib/admin/queries"
type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export function extractApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorPayload> | undefined;
  const payload = axiosError?.response?.data;

  if (Array.isArray(payload?.message)) {
    return payload.message.join(", ");
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (axiosError?.message) {
    return axiosError.message;
  }

  return "Request failed";
}

// ─── useAdminLogin ───────────────────────────────────────────────────────────
// Fix: saveAdminSession is called synchronously inside onSuccess, which runs
// BEFORE the login page's own onSuccess callback. This means by the time
// refreshSession() is called in the page, the token is guaranteed to be in
// localStorage AND the axios instance's default header is updated.
export function useAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation<AdminLoginResponse, Error, AdminLoginInput>({
    mutationFn: async (payload) => {
      const response = await adminApi.post<AdminLoginResponse>(
        "/admin/auth/login",
        payload
      );
      return response.data;
    },

    onSuccess: (data) => {
      // 1. Write token + identity to localStorage
      saveAdminSession(data);

      // 2. Immediately update the axios instance's Authorization header so
      //    any requests fired after the redirect carry the token without
      //    waiting for the interceptor to re-read from localStorage.
      //    This is the defensive fix for the blank dashboard on first load.
      const token =
        (data as any)?.accessToken ??
        (data as any)?.token ??
        (data as any)?.jwt;

      if (token && typeof token === "string") {
        adminApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // 3. Seed the React Query cache so useAdminMe on the dashboard
      //    resolves instantly from cache instead of firing a network request.
      queryClient.setQueryData(
        adminQueryKeys.me,
        { admin: data.admin } satisfies AdminMeResponse
      );
    },

    onError: () => {
      // Clear any partial session on failure
      clearAdminSession();
      // Also clear the stale axios header if present
      delete adminApi.defaults.headers.common["Authorization"];
    },
  });
}

// ─── useAdminMe ──────────────────────────────────────────────────────────────
export function useAdminMe(enabled = true) {
  return useQuery<AdminMeResponse, Error>({
    queryKey: adminQueryKeys.me,
    queryFn: async () => {
      const response = await adminApi.get<AdminMeResponse>("/admin/me");
      return response.data;
    },
    enabled,
    retry: false,
    // Keep the cached value from login alive for 5 minutes so the dashboard
    // never fires a redundant /admin/me request immediately after redirect.
    staleTime: 5 * 60 * 1000,
  });
}