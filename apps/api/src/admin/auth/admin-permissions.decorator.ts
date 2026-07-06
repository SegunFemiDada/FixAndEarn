//path: apps/api/src/admin/auth/admin-permissions.decorator.ts
import { SetMetadata } from "@nestjs/common";
import type { AdminPermission } from "./admin-permissions";

export const ADMIN_PERMISSIONS_KEY = "admin_permissions";

export const AdminPermissions = (
  ...permissions: AdminPermission[]
) => SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);