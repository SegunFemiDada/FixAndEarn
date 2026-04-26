"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOwn2faStatus,
  rotateAdminOwn2fa,
  verifyAdminOwn2fa,
} from "@/lib/admin/twofa/api";
import type {
  AdminOwn2faRotatePayload,
  AdminOwn2faRotateResponse,
  AdminOwn2faStatusResponse,
  AdminOwn2faVerifyPayload,
  AdminOwn2faVerifyResponse,
} from "@/lib/admin/twofa/types";

export const adminTwofaQueryKeys = {
  all: ["admin", "2fa"] as const,
  status: ["admin", "2fa", "status"] as const,
};

export function useAdminOwn2faStatus(enabled = true) {
  return useQuery<AdminOwn2faStatusResponse, Error>({
    queryKey: adminTwofaQueryKeys.status,
    queryFn: getAdminOwn2faStatus,
    enabled,
    retry: false,
  });
}

export function useAdminOwn2faVerify() {
  return useMutation<AdminOwn2faVerifyResponse, Error, AdminOwn2faVerifyPayload>({
    mutationFn: verifyAdminOwn2fa,
  });
}

export function useAdminOwn2faRotate() {
  const queryClient = useQueryClient();

  return useMutation<AdminOwn2faRotateResponse, Error, AdminOwn2faRotatePayload>({
    mutationFn: rotateAdminOwn2fa,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminTwofaQueryKeys.all });
    },
  });
}