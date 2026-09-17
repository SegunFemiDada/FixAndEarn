// Path: apps/api/src/admin/users/admin-deletion-dependency.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminDeletionDependencyRepo {
  constructor(private readonly prisma: PrismaService) {}

  async getDependencies(userId: string) {
    const [
      user,
      wallets,
      activeJobsPosted,
      activeJobsAssigned,
      pendingApplications,
      openDisputes,
      pendingWithdrawals,
      pendingDeposits,
      pendingJobPayments,
      availableEarnings,
      pendingCompletionRequests,
      openConversations,
      bankDetails,
      verification,
      ledgerEntryCount,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          deletionRequestStatus: true,
          deletionRequestedAt: true,
        },
      }),
      this.prisma.wallet.findMany({
        where: { userId },
        orderBy: { role: "asc" },
        select: {
          id: true,
          role: true,
          balanceMilliFec: true,
        },
      }),
      this.prisma.job.findMany({
        where: {
          clientId: userId,
          status: { in: ["OPEN", "IN_PROGRESS", "DISPUTED"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          skillCategory: true,
          priceMilliFec: true,
          lockedPriceMilliFec: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.job.findMany({
        where: {
          fixerId: userId,
          status: { in: ["OPEN", "IN_PROGRESS", "DISPUTED"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          skillCategory: true,
          priceMilliFec: true,
          lockedPriceMilliFec: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.jobApplication.findMany({
        where: {
          fixerId: userId,
          status: "APPLIED",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          jobId: true,
          status: true,
          createdAt: true,
          job: {
            select: {
              id: true,
              status: true,
              clientId: true,
              fixerId: true,
              skillCategory: true,
            },
          },
        },
      }),
      this.prisma.dispute.findMany({
        where: {
          status: "OPEN",
          OR: [
            { openedByUserId: userId },
            {
              job: {
                OR: [
                  { clientId: userId },
                  { fixerId: userId },
                ],
              },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          jobId: true,
          openedByUserId: true,
          reason: true,
          status: true,
          createdAt: true,
          job: {
            select: {
              id: true,
              status: true,
              clientId: true,
              fixerId: true,
            },
          },
        },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: {
          userId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amountMilliFec: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.deposit.findMany({
        where: {
          userId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          reference: true,
          amountMilliFec: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.jobPayment.findMany({
        where: {
          status: "PENDING",
          job: {
            OR: [
              { clientId: userId },
              { fixerId: userId },
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          jobId: true,
          amountMilliFec: true,
          paymentFeeMilliFec: true,
          status: true,
          type: true,
          paymentReference: true,
          createdAt: true,
          expiresAt: true,
          job: {
            select: {
              id: true,
              clientId: true,
              fixerId: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.fixerEarning.findMany({
        where: {
          fixerId: userId,
          status: { in: ["AVAILABLE", "PARTIALLY_WITHDRAWN"] },
          availableMilliFec: { gt: 0 },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          jobId: true,
          amountMilliFec: true,
          availableMilliFec: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.jobCompletionRequest.findMany({
        where: {
          fixerId: userId,
          status: "PENDING",
        },
        orderBy: { requestedAt: "desc" },
        take: 50,
        select: {
          id: true,
          jobId: true,
          fixerId: true,
          status: true,
          requestedAt: true,
          job: {
            select: {
              id: true,
              status: true,
              clientId: true,
              fixerId: true,
            },
          },
        },
      }),
      this.prisma.conversation.findMany({
        where: {
          OR: [
            { fixerId: userId },
            { job: { clientId: userId } },
          ],
          AND: [
            {
              OR: [
                { status: "OPEN" },
                { active: true },
              ],
            },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          jobId: true,
          fixerId: true,
          status: true,
          active: true,
          updatedAt: true,
        },
      }),
      this.prisma.bankDetails.findUnique({
        where: { userId },
        select: {
          id: true,
          bankName: true,
          accountName: true,
          accountNumber: true,
        },
      }),
      this.prisma.identityVerification.findUnique({
        where: { userId },
        select: {
          id: true,
          status: true,
          ninImagePath: true,
          selfieImagePath: true,
          utilityBillPath: true,
        },
      }),
      this.prisma.ledgerEntry.count({
        where: {
          wallet: { userId },
        },
      }),
    ]);

    return {
      user,
      wallets,
      activeJobsPosted,
      activeJobsAssigned,
      pendingApplications,
      openDisputes,
      pendingWithdrawals,
      pendingDeposits,
      pendingJobPayments,
      availableEarnings,
      pendingCompletionRequests,
      openConversations,
      bankDetails,
      verification,
      ledgerEntryCount,
    };
  }
}
