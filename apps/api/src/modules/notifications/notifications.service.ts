//path: apps/api/src/modules/notifications/notifications.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, NotificationType } from "@prisma/client";

type PrismaLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    userId: string;
    type: NotificationType; // controller/service call sites can pass string; prisma needs enum
    title: string;
    body: string;
    idempotencyKey: string;
    data?: any;
    prisma?: PrismaLike;
  }) {
    const db = input.prisma ?? this.prisma;

    // idempotency (NOW valid because idempotencyKey is @unique in schema)
    const existing = await db.notification.findUnique({
      where: { idempotencyKey: input.idempotencyKey }
    });
    if (existing) return existing;

    return db.notification.create({
      data: {
        userId: input.userId,
        type: input.type as NotificationType,
        title: input.title,
        body: input.body,
        idempotencyKey: input.idempotencyKey,
        data: input.data ?? undefined
      }
    });
  }

    // Controller expects: notifications.list(userId, { skip, take, unreadOnly })
  async list(
    userId: string,
    args?: { take?: number; skip?: number; unreadOnly?: boolean }
  ) {
    const take = args?.take ?? 30;
    const skip = args?.skip ?? 0;
    const unreadOnly = args?.unreadOnly ?? false;

    const where: any = { userId };
    if (unreadOnly) where.readAt = null;

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip
      }),
      this.prisma.notification.count({ where })
    ]);

    return { total, take, skip, unreadOnly, notifications: rows };
  }

  async markRead(userId: string, notificationId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!n || n.userId !== userId) return { ok: true };

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });

    return { ok: true };
  }

  // Controller expects: notifications.markAllRead(...)
  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });

    return { ok: true };
  }
}