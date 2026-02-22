import { Injectable } from "@nestjs/common";
import { PrismaService } from "../infra/prisma/prisma.service";
import { AdminRole } from "@prisma/client";

@Injectable()
export class AdminRepo {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.admin.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.admin.findUnique({ where: { id } });
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
    metadata?: any;
  }) {
    return this.prisma.adminAuditLog.create({
      data: {
        actorAdminId: data.actorAdminId,
        action: data.action,
        description: data.description,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        metadata: data.metadata ?? undefined
      }
    });
  }
}
