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

export type AdminSecurityInvestigationCorrelationKeys = {
  userId: string | null;
  jobId: string | null;
  withdrawalId: string | null;
  depositId: string | null;
  paymentId: string | null;
  reportId: string | null;
  messageId: string | null;
  conversationId: string | null;
  targetAdminId: string | null;
};

export type AdminSecurityInvestigationUser = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  deletionRequestStatus: string | null;
  forceReverify: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityInvestigationJob = {
  id: string;
  status: string;
  skillCategory: string;
  clientId: string;
  fixerId: string | null;
  priceMilliFec: number;
  lockedPriceMilliFec: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityInvestigationWithdrawal = {
  id: string;
  userId: string;
  amountMilliFec: number;
  status: string;
  failureReason: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
};

export type AdminSecurityInvestigationDeposit = {
  id: string;
  userId: string;
  reference: string;
  amountMilliFec: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityInvestigationPayment = {
  id: string;
  jobId: string;
  amountMilliFec: number;
  paymentFeeMilliFec: number;
  status: string;
  type: string;
  paymentReference: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  expiresAt: string | null;
};

export type AdminSecurityInvestigationReport = {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityInvestigationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type AdminSecurityInvestigationConversation = {
  id: string;
  jobId: string | null;
  fixerId: string;
  status: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityInvestigationAdmin = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  is2faEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityNearbyEvent = {
  id: string;
  action: string;
  description: string;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

export type AdminSecurityInvestigationResponse = {
  log: AdminSecurityLog & {
    metadata: Record<string, unknown>;
  };
  correlations: {
    user: AdminSecurityInvestigationUser | null;
    job: AdminSecurityInvestigationJob | null;
    withdrawal: AdminSecurityInvestigationWithdrawal | null;
    deposit: AdminSecurityInvestigationDeposit | null;
    payment: AdminSecurityInvestigationPayment | null;
    report: AdminSecurityInvestigationReport | null;
    message: AdminSecurityInvestigationMessage | null;
    conversation: AdminSecurityInvestigationConversation | null;
    targetAdmin: AdminSecurityInvestigationAdmin | null;
  };
  correlationKeys: AdminSecurityInvestigationCorrelationKeys;
  nearbyEvents: AdminSecurityNearbyEvent[];
};
