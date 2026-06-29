//path: apps/api/src/admin/admin.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../infra/prisma/prisma.service";
import { AdminRole, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

@Injectable()
export class AdminRepo {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.admin.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.admin.findUnique({ where: { id } });
  }

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
        sessionVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  countAdmins() {
    return this.prisma.admin.count();
  }

  countSuperAdmins(args?: { isActive?: boolean }) {
    return this.prisma.admin.count({
      where: {
        role: AdminRole.SUPER_ADMIN,
        ...(typeof args?.isActive === "boolean"
          ? { isActive: args.isActive }
          : {}),
      },
    });
  }

  createAdmin(data: {
    email: string;
    fullName: string;
    passwordHash: string;
    role: AdminRole;
    totpSecretEncrypted: string;
    totpSecretIv: string;
  }) {
    return this.prisma.admin.create({ data });
  }

  updateAdmin(id: string, data: Prisma.AdminUpdateInput) {
    return this.prisma.admin.update({
      where: { id },
      data,
    });
  }

  incrementSessionVersion(id: string) {
  return this.prisma.admin.update({
    where: { id },
    data: {
      sessionVersion: {
        increment: 1,
      },
    },
  });
}

  createAuditLog(data: {
    actorAdminId: string;
    action: string;
    description: string;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Prisma.JsonObject;
  }) {
    return this.prisma.adminAuditLog.create({
      data: {
        actorAdminId: data.actorAdminId,
        action: data.action,
        description: data.description,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        metadata: data.metadata ?? undefined,
      },
    });
  }
  createRefreshToken(data: {
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return this.prisma.adminRefreshToken.create({
    data: {
      id: randomUUID(),
      adminId: data.adminId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    },
  });
}

findRefreshTokenByHash(tokenHash: string) {
  return this.prisma.adminRefreshToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      admin: true,
    },
  });
}

deleteRefreshToken(id: string) {
  return this.prisma.adminRefreshToken.delete({
    where: { id },
  });
}

deleteRefreshTokensForAdmin(adminId: string) {
  return this.prisma.adminRefreshToken.deleteMany({
    where: {
      adminId,
    },
  });
}
}