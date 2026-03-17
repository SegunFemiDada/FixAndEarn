// Path: apps/api/src/admin/users/admin-users.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminUsersRepo {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(args: { q?: string; role?: "CLIENT" | "FIXER"; skip: number; take: number }) {
    const where: any = {};

    if (args.q?.trim()) {
      const q = args.q.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (args.role) {
      where.roles = {
        some: { role: { code: args.role } },
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
        forceReverify: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { role: { select: { code: true, name: true } } } },
        verification: { select: { status: true, state: true, city: true, lga: true } },
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
        forceReverify: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { role: { select: { code: true, name: true } } } },
        verification: true,
        wallets: {
          select: {
            id: true,
            role: true,
            balanceMilliFec: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        bankDetails: true,
        deposits: { orderBy: { createdAt: "desc" }, take: 20 },
        withdrawals: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
  }

  async setActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive } });
  }

  async setForceReverify(userId: string, forceReverify: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { forceReverify } });
  }

  async updateAdminNotes(userId: string, notes: string | null) {
    return this.prisma.user.update({ where: { id: userId }, data: { adminNotes: notes } });
  }
}