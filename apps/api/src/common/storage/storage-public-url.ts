export function toPublicFileUrl(pathOrKey: string | null | undefined): string | null {
  if (!pathOrKey) return null;

  if (pathOrKey.startsWith("http://") || pathOrKey.startsWith("https://")) {
    return pathOrKey;
  }

  const baseUrl =
    process.env.PUBLIC_ASSET_BASE_URL ||
    process.env.APP_BASE_URL ||
    `http://localhost:${process.env.API_PORT || 3000}`;

  if (pathOrKey.startsWith("/")) {
    return `${baseUrl}${pathOrKey}`;
  }

  return `${baseUrl}/${pathOrKey}`;
}