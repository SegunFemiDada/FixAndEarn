// Path: apps/web/src/lib/verification/me.query.ts
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export function useVerificationMe() {
  return useQuery({
    queryKey: ["verification", "me"],
    queryFn: async () => {
      const res = await apiClient.get("/verification/me");
      return res.data as { status: VerificationStatus } & Record<string, any>;
    },
    staleTime: 10_000,
    retry: 1,
  });
}
