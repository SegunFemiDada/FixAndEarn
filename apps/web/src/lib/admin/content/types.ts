//path: apps/web/src/lib/admin/content/types.ts
export type AdminNotificationTemplate = {
  key: string;
  title: string;
  body: string;
  isEnabled: boolean;
};

export type AdminContentOverviewResponse = {
  userAgreement: string;
  privacyPolicy: string;
  faqContent: string;
  supportContent: string;
  skillsList: string[];
  bankList: string[];
  notificationTemplates: AdminNotificationTemplate[];
};

export type UpdateAdminContentPayload = {
  userAgreement?: string;
  privacyPolicy?: string;
  faqContent?: string;
  supportContent?: string;
  skillsList?: string[];
  bankList?: string[];
  notificationTemplates?: AdminNotificationTemplate[];
};

export type UpdateAdminContentResponse = {
  ok: true;
  content: AdminContentOverviewResponse;
};