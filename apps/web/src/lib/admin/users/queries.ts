// Path: apps/web/src/lib/admin/users/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  forceReverifyAdminUser,
  getAdminUserById,
  searchAdminUsers,
  setAdminUserNotes,
  suspendAdminUser,
  unsuspendAdminUser,
} from "@/lib/admin/users/api";
import type {
  AdminUserActionPayload,
  AdminUserActionResponse,
  AdminUserDetail,
  AdminUserListItem,
  SearchUsersParams,
} from "@/lib/admin/users/types";
import { updateAdminUser } from "./api";


export const adminUsersQueryKeys = {
  all: ["admin", "users"] as const,
  list: (params: SearchUsersParams) =>
    [
      ...adminUsersQueryKeys.all,
      "list",
      params.q ?? "",
      params.role ?? "ALL",
      params.verificationStatus ?? "ALL",
      params.skip ?? 0,
      params.take ?? 20,
    ] as const,
  detail: (id: string) => [...adminUsersQueryKeys.all, "detail", id] as const,
};

export function useAdminUsersList(params: SearchUsersParams, enabled = true) {
  return useQuery<AdminUserListItem[], Error>({
    queryKey: adminUsersQueryKeys.list(params),
    queryFn: () => searchAdminUsers(params),
    enabled,
  });
}

export function useAdminUserDetail(id: string, enabled = true) {
  return useQuery<AdminUserDetail, Error>({
    queryKey: adminUsersQueryKeys.detail(id),
    queryFn: () => getAdminUserById(id),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}

export function useAdminSuspendUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminUserActionResponse, Error, AdminUserActionPayload>({
    mutationFn: (payload) => suspendAdminUser(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all });
    },
  });
}

export function useAdminUnsuspendUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminUserActionResponse, Error, AdminUserActionPayload>({
    mutationFn: (payload) => unsuspendAdminUser(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all });
    },
  });
}

export function useAdminForceReverifyUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminUserActionResponse, Error, AdminUserActionPayload>({
    mutationFn: (payload) => forceReverifyAdminUser(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all });
    },
  });
}

export function useAdminSetUserNotes(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminUserActionResponse, Error, AdminUserActionPayload>({
    mutationFn: (payload) => setAdminUserNotes(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all });
    },
  });
}
export function useAdminUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.detail(id) });
    },
  });
}