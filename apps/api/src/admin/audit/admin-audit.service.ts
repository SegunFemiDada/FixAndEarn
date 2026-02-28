import { Injectable } from "@nestjs/common";
import { AdminRepo } from "../admin.repo";
import { Prisma } from "@prisma/client";

@Injectable()
export class AdminAuditService {
  constructor(private readonly repo: AdminRepo) {}

  async log(args: {
    actorAdminId: string;
    action: string;
    description: string;
    ip?: string;
    userAgent?: string;
    metadata?: Prisma.JsonObject;
  }) {
    await this.repo.createAuditLog({
      actorAdminId: args.actorAdminId,
      action: args.action,
      description: args.description,
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
      metadata: args.metadata
    });
  }
}
