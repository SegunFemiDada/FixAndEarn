// apps/api/src/common/storage/storage-public-url.ts
export function toPublicFileUrl(pathOrKey: string | null | undefined): string | null {
  if (!pathOrKey) return null;

  if (pathOrKey.startsWith("http://") || pathOrKey.startsWith("https://")) {
    return pathOrKey;
  }

  const baseUrl =
    process.env.API_BASE_URL ||
    process.env.PUBLIC_ASSET_BASE_URL ||
    process.env.BACKEND_URL ||
    `http://localhost:${process.env.API_PORT || 3000}`;

  if (pathOrKey.startsWith("/")) {
    return `${baseUrl}${pathOrKey}`;
  }

  return `${baseUrl}/${pathOrKey}`;
}