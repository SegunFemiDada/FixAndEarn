// Path: apps/web/src/lib/admin/users/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveAdminDeletion,
  forceReverifyAdminUser,
  getAdminDeletionRequests,
  getAdminUserById,
  rejectAdminDeletion,
  searchAdminUsers,
  setAdminUserNotes,
  suspendAdminUser,
  unsuspendAdminUser,
} from "@/lib/admin/users/api";

import type {
  AdminDeletionRequest,
  AdminDeletionReviewResponse,
  AdminUserActionPayload,
  AdminUserActionResponse,
  AdminUserDetail,
  AdminUserListItem,
  DeletionRequestStatus,
  SearchUsersParams,
} from "@/lib/admin/users/types";
import { updateAdminUser } from "./api";
import { invalidateSidebarNotifications } from "@/lib/admin/sidebar-notifications/invalidate";


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
  deletionRequests: (status?: DeletionRequestStatus) =>
  [
    ...adminUsersQueryKeys.all,
    "deletion-requests",
    status ?? "ALL",
  ] as const,
};

export function useAdminUsersList(params: SearchUsersParams, enabled = true) {
  return useQuery<AdminUserListItem[], Error>({
    queryKey: adminUsersQueryKeys.list(params),
    queryFn: () => searchAdminUsers(params),
    enabled,
  });
}
export function useAdminDeletionRequests(
  status?: DeletionRequestStatus,
  enabled = true
) {
  return useQuery<AdminDeletionRequest[], Error>({
    queryKey: adminUsersQueryKeys.deletionRequests(status),
    queryFn: () => getAdminDeletionRequests(status),
    enabled,
    retry: false,
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
export function useAdminApproveDeletion() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminDeletionReviewResponse,
    Error,
    string
  >({
    mutationFn: (id) => approveAdminDeletion(id),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminUsersQueryKeys.all,
        }),
        invalidateSidebarNotifications(queryClient),
      ]);
    },
  });
}

export function useAdminRejectDeletion() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminDeletionReviewResponse,
    Error,
    {
      id: string;
      reason?: string;
    }
  >({
    mutationFn: ({ id, reason }) =>
      rejectAdminDeletion(id, { reason }),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminUsersQueryKeys.all,
        }),
        invalidateSidebarNotifications(queryClient),
      ]);
    },
  });
}