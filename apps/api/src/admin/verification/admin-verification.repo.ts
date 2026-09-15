// Path: apps/api/src/admin/verification/admin-verification.repo.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminVerificationRepo {
  constructor(private readonly prisma: PrismaService) {}

  listPending(skip: number, take: number) {
    return this.prisma.identityVerification.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      skip,
      take,
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        state: true,
        city: true,
        lga: true,
        skills: true,
        ninVerificationStatus: true,
        ninVerifiedAt: true,
        ninVerifiedByAdminId: true,
        ninVerificationNote: true,
        user: {
          select: {
            email: true,
            fullName: true,
            isActive: true,
          },
        },
      },
    });
  }

  getById(id: string) {
    return this.prisma.identityVerification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });
  }

  getByRekognitionFaceId(faceId: string) {
    return this.prisma.identityVerification.findUnique({
      where: {
        rekognitionFaceId: faceId,
      },
      select: {
        userId: true,
        status: true,
      },
    });
  }

  async decide(args: {
    id: string;
    status: "APPROVED" | "REJECTED";
    adminId: string;
    reason?: string | null;
    rekognitionFaceId?: string | null;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.identityVerification.update({
        where: { id: args.id },
        data: {
          status: args.status,
          reviewedByAdminId: args.adminId,
          reviewedAt: new Date(),
          reviewReason: args.reason ?? null,
          ...(args.status === "APPROVED"
            ? {
                rekognitionFaceId: args.rekognitionFaceId ?? null,
              }
            : {}),
        },
      });

      if (args.status === "APPROVED") {
        await tx.user.update({
          where: {
            id: updated.userId,
          },
          data: {
            forceReverify: false,
          },
        });
      }

      return updated;
    });
  }

  async decideNin(args: {
    id: string;
    status: "VERIFIED" | "FAILED";
    adminId: string;
    note: string;
  }) {
    return this.prisma.identityVerification.update({
      where: {
        id: args.id,
      },
      data: {
      ninVerificationStatus: args.status,
      ninVerifiedAt:
        args.status === "VERIFIED" ? new Date() : null,
      ninVerifiedByAdminId: args.adminId,
      ninVerificationNote: args.note,
    },
    });
  }
}