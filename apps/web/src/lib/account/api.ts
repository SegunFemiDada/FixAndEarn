// Path: apps/web/src/lib/account/api.ts
import apiClient from "@/lib/apiClient";

export async function switchRole(payload: { role: "CLIENT" | "FIXER" }): Promise<any> {
  const res = await apiClient.post("/account/roles/switch", payload);
  return res.data;
}
