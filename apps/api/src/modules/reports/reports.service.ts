// apps/api/src/modules/reports/reports.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
  reporterId: string;
  targetType: "JOB" | "CHAT_MESSAGE";
  targetId: string;
  reason: string;
  description?: string;
  jobId?: string;
  fixerId?: string;
}) {
  return this.prisma.report.create({
    data: {
      reporterId: data.reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      description: data.description,
      jobId: data.jobId,
      fixerId: data.fixerId,
    },
  });
}

  async findAll() {
    return this.prisma.report.findMany({
      include: { reporter: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPending() {
    return this.prisma.report.findMany({
      where: { status: "PENDING" },
      include: { reporter: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolve(id: string, resolvedByAdminId: string) {
    return this.prisma.report.update({
      where: { id },
      data: { status: "RESOLVED", resolvedBy: resolvedByAdminId, resolvedAt: new Date() },
    });
  }

  async dismiss(id: string, resolvedByAdminId: string) {
    return this.prisma.report.update({
      where: { id },
      data: { status: "DISMISSED", resolvedBy: resolvedByAdminId, resolvedAt: new Date() },
    });
  }
  
}