import type { AdminRole } from "@/lib/admin/types";

export type AdminOwn2faStatusResponse = {
  admin: {
    id: string;
    email: string;
    fullName: string;
    role: AdminRole;
    isActive: boolean;
    is2faEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
  policy: {
    enforced: boolean;
    backupCodesSupported: boolean;
  };
};

export type AdminOwn2faVerifyPayload = {
  totp: string;
};

export type AdminOwn2faVerifyResponse = {
  ok: true;
  verified: true;
};

export type AdminOwn2faRotatePayload = {
  reason?: string;
};

export type AdminOwn2faRotateResponse = {
  ok: true;
  totpSecret: string;
  totpProvisioningUri: string;
};