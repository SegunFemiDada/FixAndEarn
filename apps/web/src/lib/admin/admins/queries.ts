"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdmin,
  deactivateAdmin,
  listAdmins,
  reactivateAdmin,
  rotateAdminTotp,
} from "@/lib/admin/admins/api";
import type {
  AdminAccountActionPayload,
  AdminAccountActionResponse,
  AdminListItem,
  CreateAdminPayload,
  CreateAdminResponse,
  RotateAdminTotpResponse,
} from "@/lib/admin/admins/types";

export const adminAdminsQueryKeys = {
  all: ["admin", "admins"] as const,
  list: ["admin", "admins", "list"] as const,
};

export function useAdminAdminsList(enabled = true) {
  return useQuery<AdminListItem[], Error>({
    queryKey: adminAdminsQueryKeys.list,
    queryFn: listAdmins,
    enabled,
    retry: false,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation<CreateAdminResponse, Error, CreateAdminPayload>({
    mutationFn: createAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminAdminsQueryKeys.all });
    },
  });
}

export function useDeactivateAdmin(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminAccountActionResponse, Error, AdminAccountActionPayload>({
    mutationFn: (payload) => deactivateAdmin(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminAdminsQueryKeys.all });
    },
  });
}

export function useReactivateAdmin(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminAccountActionResponse, Error, AdminAccountActionPayload>({
    mutationFn: (payload) => reactivateAdmin(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminAdminsQueryKeys.all });
    },
  });
}

export function useRotateAdminTotp(id: string) {
  const queryClient = useQueryClient();

  return useMutation<RotateAdminTotpResponse, Error, AdminAccountActionPayload>({
    mutationFn: (payload) => rotateAdminTotp(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminAdminsQueryKeys.all });
    },
  });
}