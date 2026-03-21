import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationType, Prisma } from "@prisma/client";

@Injectable()
export class AdminNotificationsRepo {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
    });
  }

  findUsersByIds(userIds: string[]) {
    return this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  listActiveUserIds() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async createManySystemAnnouncements(args: {
    rows: Array<{
      userId: string;
      title: string;
      body: string;
      idempotencyKey: string;
      data?: Prisma.InputJsonValue;
    }>;
  }) {
    if (args.rows.length === 0) {
      return { count: 0 };
    }

    return this.prisma.notification.createMany({
      data: args.rows.map((row) => ({
        userId: row.userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: row.title,
        body: row.body,
        idempotencyKey: row.idempotencyKey,
        data: row.data,
      })),
      skipDuplicates: true,
    });
  }
}