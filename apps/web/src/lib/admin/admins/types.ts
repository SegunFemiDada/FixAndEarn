import type { AdminRole } from "@/lib/admin/types";

export type AdminListItem = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  is2faEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminPayload = {
  email: string;
  fullName: string;
  password: string;
  role: AdminRole;
};

export type CreateAdminResponse = {
  ok: true;
  admin: AdminListItem;
  totpSecret: string;
  totpProvisioningUri: string;
};

export type AdminAccountActionPayload = {
  reason?: string;
};

export type AdminAccountActionResponse = {
  ok: true;
  status: "ACTIVE" | "INACTIVE";
};

export type RotateAdminTotpResponse = {
  ok: true;
  targetAdminId: string;
  totpSecret: string;
  totpProvisioningUri: string;
};