// Path: apps/web/src/lib/auth/jwt.ts
export type Role = "CLIENT" | "FIXER";

function safeJsonParse(str: string): any | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function safeBase64UrlDecode(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

export function decodeJwt(token: string | null): any | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const decoded = safeBase64UrlDecode(parts[1]);
  if (!decoded) return null;
  return safeJsonParse(decoded);
}

export function decodeJwtRoles(token: string | null): Role[] {
  const payload = decodeJwt(token);
  if (!payload) return [];

  const candidates: any[] = [];

  // common patterns
  candidates.push(payload.roles);
  candidates.push(payload.role);
  candidates.push(payload.activeRole);
  candidates.push(payload.currentRole);

  // sometimes nested
  candidates.push(payload.user?.roles);
  candidates.push(payload.user?.role);

  const flat: string[] = [];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      for (const x of c) flat.push(String(x));
    } else {
      flat.push(String(c));
    }
  }

  const roles = flat
    .map((r) => r.toUpperCase())
    .filter((r): r is Role => r === "CLIENT" || r === "FIXER");

  return Array.from(new Set(roles));
}
// Add to: apps/web/src/lib/auth/jwt.ts

export function decodeJwtUserId(token: string | null): string | null {
  const payload = decodeJwt(token);
  if (!payload) return null;

  const candidate =
    payload.userId ??
    payload.sub ??
    payload.id ??
    payload.user?.id ??
    payload.user?.userId;

  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}