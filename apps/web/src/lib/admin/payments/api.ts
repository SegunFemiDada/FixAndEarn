import { adminApi } from "@/lib/admin/api";
import type {
  AdminPaymentDetail,
  AdminPaymentListItem,
  AdminPaymentSearchParams,
} from "./types";

export async function searchAdminPayments(
  params: AdminPaymentSearchParams = {},
): Promise<{
  items: AdminPaymentListItem[];
  total: number;
  skip: number;
  take: number;
}> {
  const response = await adminApi.get("/admin/payments", {
    params: {
      q: params.q?.trim() || undefined,
      status: params.status || undefined,
      type: params.type || undefined,
      jobId: params.jobId?.trim() || undefined,
      clientId: params.clientId?.trim() || undefined,
      fixerId: params.fixerId?.trim() || undefined,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
    },
  });

  return response.data;
}

export async function getAdminPaymentById(
  id: string,
): Promise<AdminPaymentDetail> {
  const response = await adminApi.get<AdminPaymentDetail>(
    `/admin/payments/${id}`,
  );

  return response.data;
}