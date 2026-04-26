export type AdminSettingsOverviewResponse = {
  finance: {
    commissionRate: number;
    fecRateNaira: number;
    jobPostingFeeMilliFec: number;
    firstDepositMinMilliFec: number;
    firstDepositMaxMilliFec: number;
    generalDepositMinMilliFec: number;
    withdrawalMinMilliFec: number;
    withdrawalMaxMilliFec: number;
    allowedWithdrawalRoles: string[];
  };
  verification: {
    requireNin: boolean;
    requireBvnForFixerBankDetails: boolean;
    requireUtilityBill: boolean;
    requireLiveSelfie: boolean;
    forceVerificationBeforePosting: boolean;
    forceVerificationBeforeApplying: boolean;
  };
  moderation: {
    moderationEnablePhoneNumberFlag: boolean;
    moderationEnableWhatsappFlag: boolean;
    moderationEnableOffPlatformPaymentFlag: boolean;
    moderationAutoActionStrikeThreshold: number;
    moderationAutoSuspendEnabled: boolean;
  };
};

export type UpdateAdminSettingsPayload = {
  commissionRate?: number;
  fecRateNaira?: number;
  jobPostingFeeMilliFec?: number;
  firstDepositMinMilliFec?: number;
  firstDepositMaxMilliFec?: number;
  generalDepositMinMilliFec?: number;
  withdrawalMinMilliFec?: number;
  withdrawalMaxMilliFec?: number;
  requireNin?: boolean;
  requireBvnForFixerBankDetails?: boolean;
  requireUtilityBill?: boolean;
  requireLiveSelfie?: boolean;
  forceVerificationBeforePosting?: boolean;
  forceVerificationBeforeApplying?: boolean;
  moderationEnablePhoneNumberFlag?: boolean;
  moderationEnableWhatsappFlag?: boolean;
  moderationEnableOffPlatformPaymentFlag?: boolean;
  moderationAutoActionStrikeThreshold?: number;
  moderationAutoSuspendEnabled?: boolean;
  allowedWithdrawalRoles?: string[];
};

export type UpdateAdminSettingsResponse = {
  ok: true;
  settings: AdminSettingsOverviewResponse;
};