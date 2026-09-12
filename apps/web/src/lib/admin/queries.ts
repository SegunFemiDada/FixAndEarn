// Path: apps/web/src/lib/admin/queries.ts
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import adminApi from "@/lib/admin/api";
import {
  clearAdminSession,
  saveAdminSession,
} from "@/lib/admin/session";

import type {
  AdminLoginInput,
  AdminLoginResponse,
  AdminLogoutAllResponse,
  AdminMeResponse,
} from "@/lib/admin/types";
import { getUserFacingErrorMessage } from "@/lib/shared/user-facing-error";

export const adminQueryKeys = {
  me: ["admin", "me"] as const,
};


function extractApiErrorMessage(error: unknown): string {
  return getUserFacingErrorMessage(
    error,
    "We couldn't complete that admin action. Please try again.",
  );
}

export function useAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminLoginResponse,
    Error,
    AdminLoginInput
  >({
    mutationFn: async (payload) => {
      const response =
        await adminApi.post<AdminLoginResponse>(
          "/admin/auth/login",
          payload
        );

      return response.data;
    },

    onSuccess: (data) => {
      saveAdminSession(data);

      queryClient.setQueryData(
        adminQueryKeys.me,
        {
          admin: data.admin,
        } satisfies AdminMeResponse
      );
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
      const response =
        await adminApi.get<AdminMeResponse>(
          "/admin/me"
        );

      return response.data;
    },

    enabled,
    retry: false,
  });
}

export function useAdminLogoutAll() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminLogoutAllResponse,
    Error,
    void
  >({
    mutationFn: async () => {
      const response =
        await adminApi.post<AdminLogoutAllResponse>(
          "/admin/auth/logout-all"
        );

      return response.data;
    },

    onSuccess: async () => {
      clearAdminSession();

      await queryClient.clear();

      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    },
  });
}

export { extractApiErrorMessage };