import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ADMIN_ROLES_KEY } from "./admin-roles.decorator";
import { AdminRole } from "@prisma/client";

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const admin = req.user as { adminId: string; role: AdminRole } | undefined;

    if (!admin) throw new ForbiddenException("ADMIN_AUTH_REQUIRED");
    if (!required.includes(admin.role)) throw new ForbiddenException("ADMIN_FORBIDDEN");

    return true;
  }
}
