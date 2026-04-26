//path: apps/web/src/lib/verification/queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyVerification, submitVerification } from "./api";
import type { VerificationSubmitFormValues } from "./types";

function userCacheKeyFromJwt(token: string | null): string {
  if (!token) return "anon";
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "anon";
    const payload = parts[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

    // Prefer stable unique identifiers if present
    const id =
      json?.sub ??
      json?.userId ??
      json?.id ??
      json?.uid ??
      null;

    if (id) return String(id);

    // Fallback: unique-ish per token
    return token.slice(-16);
  } catch {
    return token.slice(-16);
  }
}

const keys = {
  me: (userKey: string) => ["verification", "me", userKey] as const,
  mePrefix: ["verification", "me"] as const,
};

export function useMyVerification() {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("fa_jwt") : null;

  const hasToken = !!token;
  const userKey = userCacheKeyFromJwt(token);

  return useQuery({
    queryKey: keys.me(userKey),
    queryFn: getMyVerification,
    enabled: hasToken,
    staleTime: 10_000,
    retry: false,
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.status;
      return status === "PENDING" ? 15_000 : false;
    },
  });
}

export function useSubmitVerification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (values: VerificationSubmitFormValues) =>
      submitVerification(values),
    onSuccess: async () => {
      // invalidate all “verification/me/*” regardless of which userKey is active
      await qc.invalidateQueries({ queryKey: keys.mePrefix });
    },
    onError: (err) => {
      console.error("submitVerification failed:", err);
    },
  });
}
