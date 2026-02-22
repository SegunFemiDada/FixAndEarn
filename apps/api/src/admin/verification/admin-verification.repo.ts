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
        user: { select: { email: true, fullName: true, isActive: true } }
      }
    });
  }

  getById(id: string) {
    return this.prisma.identityVerification.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, fullName: true, isActive: true, createdAt: true } }
      }
    });
  }

  async decide(args: {
    id: string;
    status: "APPROVED" | "REJECTED";
    adminId: string;
    reason?: string | null;
  }) {
    return this.prisma.identityVerification.update({
      where: { id: args.id },
      data: {
        status: args.status,
        reviewedByAdminId: args.adminId,
        reviewedAt: new Date(),
        reviewReason: args.reason ?? null
      }
    });
  }
}
