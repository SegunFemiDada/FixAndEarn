// Path: apps/web/src/lib/admin/session.ts
export const ADMIN_TOKEN_KEY = "admin_token";
export const ADMIN_IDENTITY_KEY = "admin_identity";

export type StoredAdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

function extractAccessToken(input: unknown): string | null {
  if (!input) return null;

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return null;

    if (s.split(".").length === 3 && !s.startsWith("{")) return s;

    if (s.startsWith("{")) {
      try {
        const obj = JSON.parse(s);
        return extractAccessToken(obj);
      } catch {
        return null;
      }
    }

    return null;
  }

  if (typeof input === "object") {
    const obj = input as any;
    const token =
      obj?.accessToken ??
      obj?.token ??
      obj?.jwt ??
      obj?.data?.accessToken ??
      obj?.data?.token ??
      obj?.data?.jwt;

    return typeof token === "string" && token.trim() ? token.trim() : null;
  }

  return null;
}

function normalizeAdminIdentity(input: unknown): StoredAdminIdentity | null {
  if (!input || typeof input !== "object") return null;

  const obj = input as any;
  const id = typeof obj?.id === "string" ? obj.id.trim() : "";
  const email = typeof obj?.email === "string" ? obj.email.trim() : "";
  const fullName = typeof obj?.fullName === "string" ? obj.fullName.trim() : "";
  const role = typeof obj?.role === "string" ? obj.role.trim() : "";

  if (!id || !email || !fullName || !role) return null;

  return { id, email, fullName, role };
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!raw) return null;

  const maybeToken = extractAccessToken(raw);
  if (maybeToken && maybeToken !== raw) {
    localStorage.setItem(ADMIN_TOKEN_KEY, maybeToken);
    return maybeToken;
  }

  if (raw.split(".").length !== 3) return null;
  return raw;
}

export function setAdminToken(input: string) {
  if (typeof window === "undefined") return;

  const token = extractAccessToken(input) ?? input.trim();
  if (!token) return;

  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getStoredAdminIdentity(): StoredAdminIdentity | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(ADMIN_IDENTITY_KEY);
  if (!raw) return null;

  try {
    return normalizeAdminIdentity(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function setStoredAdminIdentity(input: unknown) {
  if (typeof window === "undefined") return;

  const identity = normalizeAdminIdentity(input);
  if (!identity) return;

  localStorage.setItem(ADMIN_IDENTITY_KEY, JSON.stringify(identity));
}

export function clearStoredAdminIdentity() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_IDENTITY_KEY);
}

export function clearAdminSession() {
  clearAdminToken();
  clearStoredAdminIdentity();
}

export function saveAdminSession(input: {
  accessToken?: string;
  token?: string;
  jwt?: string;
  admin?: unknown;
}) {
  if (typeof window === "undefined") return;

  const token = extractAccessToken(input);
  if (token) setAdminToken(token);

  if (input.admin) {
    setStoredAdminIdentity(input.admin);
  }
}

export function saveAdminTokenFromPaste(input: string) {
  if (typeof window === "undefined") return;
  const token = extractAccessToken(input);
  if (token) setAdminToken(token);
}