// Path: apps/api/src/admin/sidebar-notifications/admin-sidebar-notifications.repo.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

export type AdminSidebarNotifications = {
  verificationQueue: number;
  withdrawalManagement: number;
  disputeManagement: number;
  messagingOversight: number;
  securityCenter: number;
  deletionRequests: number;
};

@Injectable()
export class AdminSidebarNotificationsRepo {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminSidebarNotifications> {
    const [
      verificationQueue,
      withdrawalManagement,
      disputeManagement,
      messagingOversight,
      deletionRequests,
      inactiveAdmins,
      adminsWithout2fa,
      failedLoginGroups,
    ] = await Promise.all([
      this.prisma.identityVerification.count({
        where: {
          status: "PENDING",
        },
      }),

      this.prisma.withdrawalRequest.count({
        where: {
          status: "PENDING",
        },
      }),

      this.prisma.dispute.count({
        where: {
          status: "OPEN",
        },
      }),

      this.prisma.moderationFlag.count({
        where: {
          status: "PENDING",
        },
      }),

      this.prisma.user.count({
        where: {
          deletionRequestStatus: "PENDING",
        },
      }),

      this.prisma.admin.count({
        where: {
          isActive: false,
        },
      }),

      this.prisma.admin.count({
        where: {
          is2faEnabled: false,
        },
      }),

      this.prisma.adminAuditLog.groupBy({
        by: ["actorAdminId"],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          action: {
            in: [
              "ADMIN_LOGIN_FAILED_PASSWORD",
              "ADMIN_LOGIN_FAILED_TOTP",
              "ADMIN_LOGIN_BLOCKED_INACTIVE",
            ],
          },
        },
        _count: {
          actorAdminId: true,
        },
      }),
    ]);

    const securityCenter =
      inactiveAdmins +
      adminsWithout2fa +
      failedLoginGroups.filter(
        (group) => group._count.actorAdminId >= 3,
      ).length;

    return {
      verificationQueue,
      withdrawalManagement,
      disputeManagement,
      messagingOversight,
      securityCenter,
      deletionRequests,
    };
  }
}