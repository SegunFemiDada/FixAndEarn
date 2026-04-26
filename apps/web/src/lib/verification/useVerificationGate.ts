//path: apps/web/src/lib/verification/useVerificationGate.ts
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMyVerification } from "./queries";

type Options = {
  requireApproved?: boolean;
};

export function useVerificationGate(options: Options = {}) {
  const { requireApproved = false } = options;
  const router = useRouter();
  const { data, isLoading, isError } = useMyVerification();

  useEffect(() => {
    if (isLoading) return;

    if (isError || !data) {
      router.replace("/login");
      return;
    }

    if (requireApproved && data.status !== "APPROVED") {
      router.replace("/app/verification");
    }
  }, [isLoading, isError, data, requireApproved, router]);

  return {
    verification: data,
    isLoading,
  };
}
