import { AdminRole } from "@prisma/client";

export const ADMIN_PERMISSIONS = {
  ADMIN_CREATE: "admin.create",
  ADMIN_UPDATE: "admin.update",
  ADMIN_DEACTIVATE: "admin.deactivate",
  ADMIN_REACTIVATE: "admin.reactivate",
  ADMIN_ROTATE_TOTP: "admin.rotate_totp",

  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",

  VERIFICATION_READ: "verification.read",
  VERIFICATION_APPROVE: "verification.approve",

  FINANCE_READ: "finance.read",
  FINANCE_REFUND: "finance.refund",

  ANALYTICS_READ: "analytics.read",

  CONTENT_MANAGE: "content.manage",

  SETTINGS_MANAGE: "settings.manage",

  SECURITY_READ: "security.read",

  REPORTS_EXPORT: "reports.export",
} as const;

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const ROLE_PERMISSIONS: Record<
  AdminRole,
  readonly AdminPermission[]
> = {
  [AdminRole.SUPER_ADMIN]: Object.values(
    ADMIN_PERMISSIONS
  ) as AdminPermission[],

  [AdminRole.SECURITY_OFFICER]: [
    ADMIN_PERMISSIONS.SECURITY_READ,
    ADMIN_PERMISSIONS.ADMIN_ROTATE_TOTP,
  ],

  [AdminRole.SUPPORT_OFFICER]: [
    ADMIN_PERMISSIONS.USERS_READ,
    ADMIN_PERMISSIONS.USERS_UPDATE,
  ],

  [AdminRole.FINANCE_OFFICER]: [
    ADMIN_PERMISSIONS.FINANCE_READ,
    ADMIN_PERMISSIONS.FINANCE_REFUND,
  ],

  [AdminRole.VERIFICATION_OFFICER]: [
    ADMIN_PERMISSIONS.VERIFICATION_READ,
    ADMIN_PERMISSIONS.VERIFICATION_APPROVE,
  ],
};