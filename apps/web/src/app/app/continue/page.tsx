// Path: apps/web/src/app/app/continue/page.tsx
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { getActiveRole, getStoredRoles, getToken } from "@/lib/auth/session";
import { useMyVerification } from "@/lib/verification/queries";

export default function ContinuePage() {
  const router = useRouter();

  const token = getToken();
  const roles = getStoredRoles();
  const activeRole = getActiveRole();

  const verification = useMyVerification();

  React.useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (roles.length === 0) {
      router.replace("/app/select-role");
      return;
    }

    if (!activeRole || !roles.includes(activeRole)) {
      router.replace("/app/select-role");
      return;
    }

    if (verification.isLoading) return;

    if (verification.isError) {
      router.replace("/app/verification");
      return;
    }

    const status = verification.data?.status;

    if (status === "APPROVED") {
      router.replace("/app/profile");
      return;
    }

    router.replace("/app/verification");
  }, [token, roles, activeRole, verification.isLoading, verification.isError, verification.data, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 text-center shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h1 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Setting up your account
        </h1>
        <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Checking your role and verification status...
        </p>
      </div>
    </div>
  );
}