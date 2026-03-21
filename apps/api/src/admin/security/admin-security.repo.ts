import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminSecurityRepo {
  constructor(private readonly prisma: PrismaService) {}

  listAdmins() {
    return this.prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        is2faEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  listRecentAuditLogs(args: {
    actions?: string[];
    take: number;
  }) {
    return this.prisma.adminAuditLog.findMany({
      where: args.actions?.length
        ? {
            action: {
              in: args.actions,
            },
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: args.take,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  listRecentAuditLogsSince(args: {
    actions?: string[];
    since: Date;
  }) {
    return this.prisma.adminAuditLog.findMany({
      where: {
        createdAt: {
          gte: args.since,
        },
        ...(args.actions?.length
          ? {
              action: {
                in: args.actions,
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }
}