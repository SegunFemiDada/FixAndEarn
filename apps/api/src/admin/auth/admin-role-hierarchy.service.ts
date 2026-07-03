import { ForbiddenException, Injectable } from "@nestjs/common";
import { AdminRole } from "@prisma/client";

@Injectable()
export class AdminRoleHierarchyService {
  private readonly hierarchy: Record<AdminRole, number> = {
    [AdminRole.SUPER_ADMIN]: 100,
    [AdminRole.SECURITY_OFFICER]: 80,
    [AdminRole.FINANCE_OFFICER]: 70,
    [AdminRole.VERIFICATION_OFFICER]: 60,
    [AdminRole.SUPPORT_OFFICER]: 50,
  };

  getLevel(role: AdminRole): number {
    return this.hierarchy[role];
  }

  canManage(
    actorRole: AdminRole,
    targetRole: AdminRole,
  ): boolean {
    return this.getLevel(actorRole) > this.getLevel(targetRole);
  }

  assertCanManage(
    actorRole: AdminRole,
    targetRole: AdminRole,
  ): void {
    if (!this.canManage(actorRole, targetRole)) {
      throw new ForbiddenException(
        "INSUFFICIENT_ROLE_HIERARCHY",
      );
    }
  }
}