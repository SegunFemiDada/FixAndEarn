import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { randomUUID } from "crypto";
import { NotificationsService } from "../../modules/notifications/notifications.service";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminNotificationsRepo } from "./admin-notifications.repo";

@Injectable()
export class AdminNotificationsService {
  constructor(
    private readonly repo: AdminNotificationsRepo,
    private readonly notifications: NotificationsService,
    private readonly audit: AdminAuditService
  ) {}

  async send(args: {
    actorAdminId: string;
    mode: "ONE" | "MANY" | "ALL";
    title: string;
    body: string;
    userId?: string;
    userIds?: string[];
  }) {
    const title = args.title.trim();
    const body = args.body.trim();

    if (!title) throw new BadRequestException("TITLE_REQUIRED");
    if (!body) throw new BadRequestException("BODY_REQUIRED");

    if (args.mode === "ONE") {
      const userId = String(args.userId ?? "").trim();
      if (!userId) throw new BadRequestException("USER_ID_REQUIRED");

      const user = await this.repo.findUserById(userId);
      if (!user) throw new NotFoundException("USER_NOT_FOUND");
      if (!user.isActive) throw new BadRequestException("USER_INACTIVE");

      const requestId = randomUUID();

      await this.notifications.create({
        userId: user.id,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        body,
        idempotencyKey: `admin_notification:${requestId}:${user.id}`,
        data: {
          kind: "ADMIN_SYSTEM_NOTIFICATION",
          mode: "ONE",
          sentByAdminId: args.actorAdminId,
        },
      });

      await this.audit.log({
        actorAdminId: args.actorAdminId,
        action: "ADMIN_NOTIFICATION_SEND_ONE",
        description: "Sent admin system notification to one user",
        metadata: {
          recipientCount: 1,
          userId: user.id,
          title,
        },
      });

      return {
        ok: true,
        mode: "ONE" as const,
        recipientCount: 1,
        recipients: [
          {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
        ],
      };
    }

    if (args.mode === "MANY") {
      const userIds = Array.from(
        new Set(
          Array.isArray(args.userIds)
            ? args.userIds.map((id) => String(id ?? "").trim()).filter(Boolean)
            : []
        )
      );

      if (userIds.length === 0) throw new BadRequestException("USER_IDS_REQUIRED");

      const users = await this.repo.findUsersByIds(userIds);
      if (users.length !== userIds.length) {
        throw new BadRequestException("ONE_OR_MORE_USERS_NOT_FOUND");
      }

      const inactive = users.filter((user) => !user.isActive);
      if (inactive.length > 0) {
        throw new BadRequestException("ONE_OR_MORE_USERS_INACTIVE");
      }

      const requestId = randomUUID();

      const result = await this.repo.createManySystemAnnouncements({
        rows: users.map((user) => ({
          userId: user.id,
          title,
          body,
          idempotencyKey: `admin_notification:${requestId}:${user.id}`,
          data: {
            kind: "ADMIN_SYSTEM_NOTIFICATION",
            mode: "MANY",
            sentByAdminId: args.actorAdminId,
          },
        })),
      });

      await this.audit.log({
        actorAdminId: args.actorAdminId,
        action: "ADMIN_NOTIFICATION_SEND_MANY",
        description: "Sent admin system notification to many users",
        metadata: {
          recipientCount: users.length,
          title,
          userIds: users.map((user) => user.id),
        },
      });

      return {
        ok: true,
        mode: "MANY" as const,
        recipientCount: users.length,
        createdCount: result.count,
        recipients: users.map((user) => ({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        })),
      };
    }

    const activeUsers = await this.repo.listActiveUserIds();
    const requestId = randomUUID();

    const batchSize = 500;
    let createdCount = 0;

    for (let i = 0; i < activeUsers.length; i += batchSize) {
      const batch = activeUsers.slice(i, i + batchSize);

      const res = await this.repo.createManySystemAnnouncements({
        rows: batch.map((user) => ({
          userId: user.id,
          title,
          body,
          idempotencyKey: `admin_notification:${requestId}:${user.id}`,
          data: {
            kind: "ADMIN_SYSTEM_NOTIFICATION",
            mode: "ALL",
            sentByAdminId: args.actorAdminId,
          },
        })),
      });

      createdCount += res.count;
    }

    await this.audit.log({
      actorAdminId: args.actorAdminId,
      action: "ADMIN_NOTIFICATION_SEND_ALL",
      description: "Sent admin system notification to all active users",
      metadata: {
        recipientCount: activeUsers.length,
        createdCount,
        title,
      },
    });

    return {
      ok: true,
      mode: "ALL" as const,
      recipientCount: activeUsers.length,
      createdCount,
    };
  }
}