// Path: apps/api/src/common/types/current-user.ts
export type CurrentUserPayload = {
  // common identifiers across different JWT / decorators
  userId?: string;
  id?: string;
  sub?: string;

  // sometimes CurrentUser() returns nested payload
  payload?: {
    userId?: string;
    id?: string;
    sub?: string;
  };

  // fields used in a few places
  email?: string;
  fullName?: string;
  isActive?: boolean;

  // Prisma often returns roles as relation objects, not strings
  roles?: unknown[];
  activeRole?: string;

  // allow extra fields without breaking typing across the app
  [key: string]: unknown;
};