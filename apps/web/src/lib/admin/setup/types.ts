export type AdminBootstrapPayload = {
  email: string;
  fullName: string;
  password: string;
};

export type AdminBootstrapResponse = {
  ok: true;
  totpSecret: string;
  totpProvisioningUri: string;
};

export type AdminBootstrapStatusResponse = {
  enabled: boolean;
  totalAdmins: number;
  hasAnyAdmin: boolean;
  hasSuperAdmin: boolean;
  allowBootstrap: boolean;
};