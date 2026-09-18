// Path: apps/api/src/admin/users/admin-users.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminUsersRepo {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(args: {
    q?: string;
    role?: "CLIENT" | "FIXER";
    verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
    skip: number;
    take: number;
  }) {
    const where: any = {};

    if (args.q?.trim()) {
      const q = args.q.trim();

      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (args.role) {
      where.roles = {
        some: { role: { code: args.role } },
      };
    }

    if (args.verificationStatus) {
      where.verification = {
        status: args.verificationStatus,
      };
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        phone: true,
        phoneVerifiedAt: true,
        forceReverify: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        verification: {
          select: {
            status: true,
            state: true,
            city: true,
            lga: true,
          },
        },
      },
    });
  }

  async getUserBase(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        phone: true,
        phoneVerifiedAt: true,
        forceReverify: true,
        deletionRequestStatus: true,
        deletionRequestedAt: true,
        deletionRequestReason: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        verification: true,
        wallets: {
          select: {
            id: true,
            role: true,
            balanceMilliFec: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        bankDetails: true,
        deposits: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
        withdrawals: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
      },
    });
  }

  async getUserInvestigation(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        phone: true,
        phoneVerifiedAt: true,
        forceReverify: true,
        deletionRequestStatus: true,
        deletionRequestedAt: true,
        deletionRequestReason: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        verification: {
          select: {
            id: true,
            userId: true,
            status: true,
            state: true,
            city: true,
            lga: true,
            bio: true,
            skills: true,
            addressHouse: true,
            addressStreet: true,
            addressArea: true,
            nearestBusStop: true,
            ninVerificationStatus: true,
            ninVerifiedAt: true,
            ninVerifiedByAdminId: true,
            ninVerificationNote: true,
            reviewedByAdminId: true,
            reviewedAt: true,
            reviewReason: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        wallets: {
          select: {
            id: true,
            role: true,
            balanceMilliFec: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        bankDetails: true,
        deposits: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
        withdrawals: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
      },
    });

    if (!user) {
      return null;
    }

    const jobsPosted = await this.prisma.job.findMany({
      where: {
        clientId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        clientId: true,
        fixerId: true,
        skillCategory: true,
        state: true,
        city: true,
        lga: true,
        area: true,
        priceMilliFec: true,
        lockedPriceMilliFec: true,
        status: true,
        moderationStatus: true,
        postingType: true,
        selectedConversationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const jobsAssigned = await this.prisma.job.findMany({
      where: {
        fixerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        clientId: true,
        fixerId: true,
        skillCategory: true,
        state: true,
        city: true,
        lga: true,
        area: true,
        priceMilliFec: true,
        lockedPriceMilliFec: true,
        status: true,
        moderationStatus: true,
        postingType: true,
        selectedConversationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const jobIds = Array.from(
      new Set([
        ...jobsPosted.map((job) => job.id),
        ...jobsAssigned.map((job) => job.id),
      ]),
    );

    const applications = await this.prisma.jobApplication.findMany({
      where: {
        fixerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        jobId: true,
        fixerId: true,
        note: true,
        status: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            clientId: true,
            fixerId: true,
            skillCategory: true,
            state: true,
            city: true,
            lga: true,
            area: true,
            priceMilliFec: true,
            lockedPriceMilliFec: true,
            status: true,
            moderationStatus: true,
            postingType: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          {
            fixerId: userId,
          },
          {
            job: {
              clientId: userId,
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        jobId: true,
        fixerId: true,
        status: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        job: {
          select: {
            id: true,
            clientId: true,
            fixerId: true,
            skillCategory: true,
            state: true,
            city: true,
            lga: true,
            area: true,
            priceMilliFec: true,
            lockedPriceMilliFec: true,
            status: true,
            moderationStatus: true,
            postingType: true,
          },
        },
        _count: {
          select: {
            messages: true,
            agreements: true,
          },
        },
      },
    });

    const reports = await this.prisma.report.findMany({
      where: {
        OR: [
          {
            reporterId: userId,
          },
          {
            fixerId: userId,
          },
          ...(jobIds.length > 0
            ? [
                {
                  jobId: {
                    in: jobIds,
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        reporterId: true,
        targetType: true,
        targetId: true,
        reason: true,
        description: true,
        status: true,
        resolvedBy: true,
        resolvedAt: true,
        fixerId: true,
        jobId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const disputes = await this.prisma.dispute.findMany({
      where: {
        OR: [
          {
            openedByUserId: userId,
          },
          ...(jobIds.length > 0
            ? [
                {
                  jobId: {
                    in: jobIds,
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        jobId: true,
        openedByUserId: true,
        reason: true,
        evidence: true,
        status: true,
        resolvedByAdminId: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const auditLogs = await this.prisma.adminAuditLog.findMany({
      where: {
        metadata: {
          path: ["userId"],
          equals: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        actorAdminId: true,
        action: true,
        description: true,
        ip: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      user,
      jobsPosted,
      jobsAssigned,
      applications,
      conversations,
      reports,
      disputes,
      auditLogs,
    };
  }

  async setActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async setActiveAndRevokeSessions(
    userId: string,
    isActive: boolean,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        sessionVersion: {
          increment: 1,
        },
      },
      select: {
        id: true,
        isActive: true,
        sessionVersion: true,
      },
    });
  }

  async setForceReverify(
    userId: string,
    forceReverify: boolean,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { forceReverify },
      select: {
        id: true,
        forceReverify: true,
        updatedAt: true,
      },
    });
  }

  async updateAdminNotes(
    userId: string,
    notes: string | null,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { adminNotes: notes },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  async updateUser(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updateVerification(
    verificationId: string,
    data: any,
  ) {
    return this.prisma.identityVerification.update({
      where: { id: verificationId },
      data,
    });
  }

  async getDeletionRequests(
    status?: "PENDING" | "APPROVED" | "REJECTED",
  ) {
    const where: any = {};

    if (status) {
      where.deletionRequestStatus = status;
    }

    return this.prisma.user.findMany({
      where: {
        deletionRequestStatus: { not: "NONE" },
        ...where,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        deletionRequestedAt: true,
        deletionRequestReason: true,
        deletionRequestStatus: true,
      },
      orderBy: {
        deletionRequestedAt: "asc",
      },
    });
  }

  async anonymiseUser(
    userId: string,
    newEmail: string,
    newName: string,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        fullName: newName,
        isActive: false,
        passwordHash: "DELETED",
        emailVerifiedAt: null,
        emailVerifyTokenHash: null,
        emailVerifyTokenExpiresAt: null,
        withdrawalPinHash: null,
      },
    });
  }

  async updateDeletionStatus(
    userId: string,
    status: "APPROVED" | "REJECTED",
    resolvedByAdminId?: string,
    reason?: string,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestStatus: status,
        adminNotes: reason
          ? `Deletion rejected: ${reason}`
          : undefined,
      },
    });
  }
}

