export function extractAccessToken(input: unknown): string | null {
  if (!input) return null;

  if (typeof input === "string") {
    const s = input.trim();
    if (s.startsWith("eyJ")) return s;

    if (s.startsWith("{")) {
      try {
        const obj = JSON.parse(s);
        const t = obj?.accessToken ?? obj?.token;
        return typeof t === "string" ? t : null;
      } catch {
        return null;
      }
    }

    return null;
  }

  if (typeof input === "object") {
    const obj = input as any;
    const t = obj?.accessToken ?? obj?.token;
    return typeof t === "string" ? t : null;
  }

  return null;
}