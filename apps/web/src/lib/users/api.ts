//path: apps/web/src/lib/users/api.ts
import apiClient from "@/lib/apiClient";
import type { DiscoverFixerItem, DiscoverFixersParams } from "./types";

export async function discoverFixers(
  params?: DiscoverFixersParams
): Promise<DiscoverFixerItem[]> {
  const res = await apiClient.get("/users/fixers/discover", { params });
  return res.data;
}