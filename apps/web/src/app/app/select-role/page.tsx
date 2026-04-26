// Path: apps/web/src/app/app/select-role/page.tsx
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useSwitchRole } from "@/lib/account/queries";
import {
  getActiveRole,
  getStoredRoles,
  getToken,
  setActiveRole,
  setStoredRoles,
  type Role,
} from "@/lib/auth/session";

function backendMessage(err: unknown): string | null {
  const e: any = err;
  const msg = e?.response?.data?.message;
  if (!msg) return null;
  if (Array.isArray(msg)) return msg.join(", ");
  return String(msg);
}

export default function SelectRolePage() {
  const router = useRouter();
  const switchRole = useSwitchRole();

  const [localError, setLocalError] = React.useState<string | null>(null);
  const [hint, setHint] = React.useState<string | null>(null);

  const token = getToken();
  const roles = getStoredRoles();
  const activeRole = getActiveRole();

  React.useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (roles.length > 0 && activeRole && roles.includes(activeRole)) {
      router.replace("/app/continue");
    }
  }, [token, roles, activeRole, router]);

  async function handleChooseRole(role: Role) {
    setLocalError(null);
    setHint(null);

    try {
      const res = await switchRole.mutateAsync({ role });

      const nextRoles = res?.roles ?? [];
      setStoredRoles(nextRoles);
      setActiveRole(role);

      if (!Array.isArray(nextRoles) || nextRoles.length === 0) {
        setHint("Role switch succeeded, but no roles were returned. Please try logging in again.");
      }

      router.replace("/app/continue");
    } catch (error) {
      setLocalError(backendMessage(error) ?? "Role switch failed.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
            FixAndEarn
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Choose your role
          </h1>
          <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Pick the role you want to use now. You can switch roles later from your personal profile.
          </p>
        </div>

        {localError && (
          <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
            {localError}
          </div>
        )}

        {hint && (
          <div className="mt-4 rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
            {hint}
          </div>
        )}

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => handleChooseRole("CLIENT")}
            disabled={switchRole.isPending}
            className={[
              "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              switchRole.isPending
                ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
            ].join(" ")}
          >
            {switchRole.isPending ? "Saving..." : "Continue as Client"}
          </button>

          <button
            type="button"
            onClick={() => handleChooseRole("FIXER")}
            disabled={switchRole.isPending}
            className={[
              "inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200",
              switchRole.isPending
                ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border-[#C5D5EE] dark:border-[#2D3F55]"
                : "border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]",
            ].join(" ")}
          >
            {switchRole.isPending ? "Saving..." : "Continue as Fixer"}
          </button>
        </div>
      </div>
    </div>
  );
}