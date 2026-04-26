export type AdminSecurityRiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export type AdminSecurityLog = {
  id: string;
  actorAdminId: string;
  action: string;
  description: string;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
  } | null;
};

export type AdminSecurityAdminSummary = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  is2faEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  successfulLogins: number;
  failedPasswordAttempts: number;
  failedTotpAttempts: number;
  blockedInactiveAttempts: number;
  totalFailedAttempts: number;
  lastSuccessfulLoginAt: string | null;
  lastFailedLoginAt: string | null;
  riskLevel: AdminSecurityRiskLevel;
};

export type AdminSecurityOverviewResponse = {
  counts: {
    totalAdmins: number;
    activeAdmins: number;
    inactiveAdmins: number;
    adminsWith2faEnabled: number;
    adminsWithout2faEnabled: number;
    flaggedAdmins: number;
    recentSuccessfulLogins: number;
    recentFailedLogins: number;
  };
  adminAuthSummary: AdminSecurityAdminSummary[];
  flaggedAdmins: AdminSecurityAdminSummary[];
  recentSecurityLogs: AdminSecurityLog[];
};

export type GetAdminSecurityOverviewParams = {
  take?: number;
};