import { Injectable } from "@nestjs/common";
import { PrismaService } from "../infra/prisma/prisma.service";
import { AdminRole, Prisma } from "@prisma/client";

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
        createdAt: true,
        updatedAt: true,
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
}