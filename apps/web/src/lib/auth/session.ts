export type Role = "CLIENT" | "FIXER";

const TOKEN_KEY = "fa_jwt";
const ROLES_KEY = "fa_roles";
const ACTIVE_ROLE_KEY = "fa_active_role";

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

function normalizeRole(input: unknown): Role | null {
  const value = String(input ?? "").trim().toUpperCase();

  if (value === "CLIENT" || value === "FIXER") return value;
  return null;
}

function normalizeRoles(input: unknown): Role[] {
  const arr = Array.isArray(input) ? input : input ? [input] : [];
  const clean = arr
    .map((r) => normalizeRole(r))
    .filter((r): r is Role => r === "CLIENT" || r === "FIXER");

  return Array.from(new Set(clean));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  const maybeToken = extractAccessToken(raw);
  if (maybeToken && maybeToken !== raw) {
    window.localStorage.setItem(TOKEN_KEY, maybeToken);
    return maybeToken;
  }

  if (raw.split(".").length !== 3) return null;
  return raw;
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;

  const t = extractAccessToken(token) ?? token.trim();
  if (!t) return;

  window.localStorage.setItem(TOKEN_KEY, t);
}

export function clearSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLES_KEY);
  window.localStorage.removeItem(ACTIVE_ROLE_KEY);
}

export function getStoredRoles(): Role[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(ROLES_KEY);
  if (!raw) return [];

  try {
    return normalizeRoles(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function setStoredRoles(roles: unknown) {
  if (typeof window === "undefined") return;

  const dedup = normalizeRoles(roles);
  window.localStorage.setItem(ROLES_KEY, JSON.stringify(dedup));

  const currentActive = getActiveRole();
  if (currentActive && dedup.includes(currentActive)) return;

  if (dedup.length === 1) {
    setActiveRole(dedup[0]);
    return;
  }

  if (dedup.length > 1 && !currentActive) {
    setActiveRole(dedup[0]);
  }
}

export function getActiveRole(): Role | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(ACTIVE_ROLE_KEY);
  return normalizeRole(raw);
}

export function setActiveRole(role: Role) {
  if (typeof window === "undefined") return;

  const normalized = normalizeRole(role);
  if (!normalized) return;

  window.localStorage.setItem(ACTIVE_ROLE_KEY, normalized);
}

export function saveSession(input: unknown) {
  if (typeof window === "undefined") return;

  const token = extractAccessToken(input);
  if (token) {
    setToken(token);
  }

  if (typeof input === "object" && input !== null) {
    const obj = input as any;

    const roles =
      obj?.user?.roles ??
      obj?.user?.role ??
      obj?.roles ??
      obj?.role ??
      obj?.data?.user?.roles ??
      obj?.data?.roles;

    if (roles) {
      setStoredRoles(roles);
    }

    const hinted =
      obj?.activeRole ??
      obj?.currentRole ??
      obj?.user?.activeRole ??
      obj?.user?.currentRole;

    const normalizedHint = normalizeRole(hinted);
    if (normalizedHint) {
      setActiveRole(normalizedHint);
    }
  }
}

export function saveSessionFromPaste(input: string) {
  if (typeof window === "undefined") return;

  const trimmed = input.trim();
  if (!trimmed) return;

  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed);
      saveSession(obj);
      return;
    } catch {
      // fall through
    }
  }

  const token = extractAccessToken(trimmed);
  if (token) setToken(token);
}