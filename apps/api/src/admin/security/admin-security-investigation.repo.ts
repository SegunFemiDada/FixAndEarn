import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

@Injectable()
export class AdminSecurityInvestigationRepo {
  constructor(private readonly prisma: PrismaService) {}

  async getInvestigation(logId: string) {
    const log = await this.prisma.adminAuditLog.findUnique({
      where: { id: logId },
      include: {
        actor: {
          select: { id: true, email: true, fullName: true, role: true, isActive: true },
        },
      },
    });

    if (!log) throw new NotFoundException("SECURITY_LOG_NOT_FOUND");

    const metadata = log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
      ? (log.metadata as Record<string, unknown>)
      : {};

    const userId = stringValue(metadata.userId) ?? stringValue(metadata.targetUserId);
    const jobId = stringValue(metadata.jobId);
    const withdrawalId = stringValue(metadata.withdrawalId);
    const depositId = stringValue(metadata.depositId);
    const paymentId = stringValue(metadata.paymentId) ?? stringValue(metadata.jobPaymentId);
    const reportId = stringValue(metadata.reportId);
    const messageId = stringValue(metadata.messageId);
    const conversationId = stringValue(metadata.conversationId);
    const targetAdminId = stringValue(metadata.targetAdminId) ?? stringValue(metadata.createdAdminId);

    const windowStart = new Date(log.createdAt.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(log.createdAt.getTime() + 30 * 60 * 1000);

    const [user, job, withdrawal, deposit, payment, report, message, conversation, targetAdmin, nearbyEvents] = await Promise.all([
      userId ? this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true, email: true, isActive: true, deletionRequestStatus: true, forceReverify: true, createdAt: true, updatedAt: true } }) : null,
      jobId ? this.prisma.job.findUnique({ where: { id: jobId }, select: { id: true, status: true, skillCategory: true, clientId: true, fixerId: true, priceMilliFec: true, lockedPriceMilliFec: true, createdAt: true, updatedAt: true } }) : null,
      withdrawalId ? this.prisma.withdrawalRequest.findUnique({ where: { id: withdrawalId }, select: { id: true, userId: true, amountMilliFec: true, status: true, failureReason: true, reviewedBy: true, createdAt: true, updatedAt: true, reviewedAt: true, paidAt: true } }) : null,
      depositId ? this.prisma.deposit.findUnique({ where: { id: depositId }, select: { id: true, userId: true, reference: true, amountMilliFec: true, status: true, createdAt: true, updatedAt: true } }) : null,
      paymentId ? this.prisma.jobPayment.findUnique({ where: { id: paymentId }, select: { id: true, jobId: true, amountMilliFec: true, paymentFeeMilliFec: true, status: true, type: true, paymentReference: true, createdAt: true, updatedAt: true, paidAt: true, expiresAt: true } }) : null,
      reportId ? this.prisma.report.findUnique({ where: { id: reportId }, select: { id: true, reporterId: true, targetType: true, targetId: true, reason: true, status: true, resolvedBy: true, createdAt: true, updatedAt: true } }) : null,
      messageId ? this.prisma.chatMessage.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true, senderId: true, body: true, createdAt: true } }) : null,
      conversationId ? this.prisma.conversation.findUnique({ where: { id: conversationId }, select: { id: true, jobId: true, fixerId: true, status: true, active: true, createdAt: true, updatedAt: true } }) : null,
      targetAdminId ? this.prisma.admin.findUnique({ where: { id: targetAdminId }, select: { id: true, email: true, fullName: true, role: true, isActive: true, is2faEnabled: true, createdAt: true, updatedAt: true } }) : null,
      this.prisma.adminAuditLog.findMany({
        where: { actorAdminId: log.actorAdminId, createdAt: { gte: windowStart, lte: windowEnd }, NOT: { id: log.id } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, action: true, description: true, ip: true, userAgent: true, metadata: true, createdAt: true },
      }),
    ]);

    return {
      log: { ...log, metadata },
      correlations: { user, job, withdrawal, deposit, payment, report, message, conversation, targetAdmin },
      correlationKeys: { userId, jobId, withdrawalId, depositId, paymentId, reportId, messageId, conversationId, targetAdminId },
      nearbyEvents,
    };
  }
}
