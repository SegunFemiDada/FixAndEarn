export const SITE_NAME = "FixAndEarn";
export const SITE_DESCRIPTION =
  "FixAndEarn connects clients in Nigeria with verified skilled workers for on-demand services.";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    return "https://fixandearn.com";
  }

  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}