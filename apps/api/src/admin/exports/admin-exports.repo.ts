//path: apps/api/src/admin/exports/admin-exports.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminExportsRepo {
  constructor(private readonly prisma: PrismaService) {}

  async listAuditLogs(args: {
    actorAdminId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    take: number;
    skip: number;
  }) {
    const where: any = {};

    if (args.actorAdminId) where.actorAdminId = args.actorAdminId;
    if (args.action) where.action = args.action;
    if (args.from || args.to) {
      where.createdAt = {};
      if (args.from) where.createdAt.gte = args.from;
      if (args.to) where.createdAt.lte = args.to;
    }

    return this.prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: args.take,
      skip: args.skip
    });
  }
}
