// Path: apps/web/src/lib/admin/types.ts
export type AdminRole =
  | "SUPER_ADMIN"
  | "VERIFICATION_OFFICER"
  | "FINANCE_OFFICER"
  | "SUPPORT_OFFICER"
  | "SECURITY_OFFICER";

export type AdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
};

export type AdminLoginInput = {
  email: string;
  password: string;
  totp: string;
};

export type AdminLoginResponse = {
  accessToken: string;
  admin: AdminIdentity;
};

export type AdminMeResponse = {
  admin: AdminIdentity;
};

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
};