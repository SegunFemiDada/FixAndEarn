import { adminApi } from "@/lib/admin/api";
import type { AdminDeletionDependencies } from "@/lib/admin/users/deletion-dependency.types";

export async function getAdminDeletionDependencies(
  id: string,
): Promise<AdminDeletionDependencies> {
  const response = await adminApi.get<AdminDeletionDependencies>(
    `/admin/users/${id}/deletion-dependencies`,
  );

  return response.data;
}
