// Path: apps/web/src/lib/admin/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import adminApi from "@/lib/admin/api";
import { clearAdminSession, saveAdminSession } from "@/lib/admin/session";
import type { AdminLoginInput, AdminLoginResponse, AdminMeResponse } from "@/lib/admin/types";

export const adminQueryKeys = {
  me: ["admin", "me"] as const,
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function extractApiErrorMessage(error: unknown): string {
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

export function useAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation<AdminLoginResponse, Error, AdminLoginInput>({
    mutationFn: async (payload) => {
      const response = await adminApi.post<AdminLoginResponse>("/admin/auth/login", payload);
      return response.data;
    },
    onSuccess: (data) => {
      saveAdminSession(data);
      queryClient.setQueryData(adminQueryKeys.me, { admin: data.admin } satisfies AdminMeResponse);
    },
    onError: () => {
      clearAdminSession();
    },
  });
}

export function useAdminMe(enabled = true) {
  return useQuery<AdminMeResponse, Error>({
    queryKey: adminQueryKeys.me,
    queryFn: async () => {
      const response = await adminApi.get<AdminMeResponse>("/admin/me");
      return response.data;
    },
    enabled,
    retry: false,
  });
}

export { extractApiErrorMessage };