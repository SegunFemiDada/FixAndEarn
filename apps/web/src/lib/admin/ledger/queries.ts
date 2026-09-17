"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminLedgerEntry,
  searchAdminLedger,
} from "./api";
import type {
  AdminLedgerInvestigation,
  AdminLedgerSearchParams,
} from "./types";

export const adminLedgerQueryKeys = {
  all: ["admin", "finance", "ledger"] as const,

  list: (params: AdminLedgerSearchParams) =>
    [
      ...adminLedgerQueryKeys.all,
      "list",
      params.scope ?? "USER",
      params.userId ?? "",
      params.walletRole ?? "ALL",
      params.type ?? "ALL",
      params.direction ?? "ALL",
      params.reference ?? "",
      params.skip ?? 0,
      params.take ?? 20,
    ] as const,

  detail: (scope: "USER" | "PLATFORM", id: string) =>
    [...adminLedgerQueryKeys.all, "detail", scope, id] as const,
};

export function useAdminLedgerList(
  params: AdminLedgerSearchParams,
  enabled = true,
) {
  return useQuery({
    queryKey: adminLedgerQueryKeys.list(params),
    queryFn: () => searchAdminLedger(params),
    enabled,
  });
}

export function useAdminLedgerEntry(
  scope: "USER" | "PLATFORM",
  id: string,
  enabled = true,
) {
  return useQuery<AdminLedgerInvestigation>({
    queryKey: adminLedgerQueryKeys.detail(scope, id),
    queryFn: () => getAdminLedgerEntry(scope, id),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}
