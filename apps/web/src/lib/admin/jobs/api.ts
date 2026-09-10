import { adminApi } from "@/lib/admin/api";
import type {
  AdminJobDetail,
  AdminJobListItem,
  AdminJobSearchParams,
} from "./types";

export async function searchAdminJobs(
  params: AdminJobSearchParams = {}
): Promise<{
  items: AdminJobListItem[];
  total: number;
  skip: number;
  take: number;
}> {
  const response = await adminApi.get("/admin/jobs", {
    params: {
      q: params.q?.trim() || undefined,
      status: params.status || undefined,
      postingType: params.postingType || undefined,
      clientId: params.clientId?.trim() || undefined,
      fixerId: params.fixerId?.trim() || undefined,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
    },
  });

  return response.data;
}

export async function getAdminJobById(
  id: string
): Promise<AdminJobDetail> {
  const response = await adminApi.get<AdminJobDetail>(
    `/admin/jobs/${id}`
  );

  return response.data;
}