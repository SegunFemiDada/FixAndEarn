// Path: apps/web/src/lib/wallet/ui.ts
import { getUserFacingErrorMessage } from "@/lib/shared/user-facing-error";

export type Role = "CLIENT" | "FIXER";

export function safeDecodeJwtRoles(token: string | null): Role[] {
  if (!token) return [];
  try {
    const parts = token.split(".");
    if (parts.length < 2) return [];
    const payload = parts[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

    const rawRoles = (json?.roles ?? json?.role ?? []) as any;
    const rolesArr: string[] = Array.isArray(rawRoles)
      ? (rawRoles as any[])
      : [rawRoles as any];

    const roles = rolesArr
      .filter(Boolean)
      .map((r) => String(r).toUpperCase())
      .filter((r): r is Role => r === "CLIENT" || r === "FIXER");

    return Array.from(new Set(roles));
  } catch {
    return [];
  }
}

export function formatFecFromMilli(milli: number): string {
  const fec = milli / 1000;
  return `${fec.toFixed(2)}FEC`;
}

export function backendMessage(err: unknown): string | null {
  return getUserFacingErrorMessage(
    err,
    "We couldn't complete that wallet action. Please try again.",
  );
}
