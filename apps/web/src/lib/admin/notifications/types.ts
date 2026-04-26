export type AdminNotificationSendMode = "ONE" | "MANY" | "ALL";

export type SendAdminNotificationPayload = {
  mode: AdminNotificationSendMode;
  title: string;
  body: string;
  userId?: string;
  userIds?: string[];
};

export type SendAdminNotificationResponse = {
  ok: true;
  mode: AdminNotificationSendMode;
  recipientCount: number;
  createdCount?: number;
  recipients?: Array<{
    id: string;
    email: string;
    fullName: string;
  }>;
};