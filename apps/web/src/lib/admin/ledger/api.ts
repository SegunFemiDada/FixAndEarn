import { adminApi } from "@/lib/admin/api";
import type {
  AdminLedgerInvestigation,
  AdminLedgerListResponse,
  AdminLedgerSearchParams,
} from "./types";

export async function searchAdminLedger(
  params: AdminLedgerSearchParams = {},
): Promise<AdminLedgerListResponse> {
  const response = await adminApi.get<AdminLedgerListResponse>(
    "/admin/finance/ledger",
    {
      params: {
        scope: params.scope ?? "USER",
        userId: params.userId?.trim() || undefined,
        walletRole: params.walletRole || undefined,
        type: params.type || undefined,
        direction: params.direction || undefined,
        reference: params.reference?.trim() || undefined,
        skip: params.skip ?? 0,
        take: params.take ?? 20,
      },
    },
  );

  return response.data;
}

export async function getAdminLedgerEntry(
  scope: "USER" | "PLATFORM",
  id: string,
): Promise<AdminLedgerInvestigation> {
  const response = await adminApi.get<AdminLedgerInvestigation>(
    `/admin/finance/ledger/${scope}/${id}`,
  );

  return response.data;
}
