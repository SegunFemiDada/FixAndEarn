// Path: /apps/api/src/common/auth/roles.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, AppRole } from "./roles.decorator";
import { UsersService } from "../../modules/users/users.service";
import * as jwt from "jsonwebtoken";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();

    // 1) Prefer Passport-populated req.user (when JwtAuthGuard ran first)
    const passportUser = req.user as { userId?: string; sub?: string } | undefined;

    // 2) Fallback: decode Bearer token (RolesGuard is global and may run before JwtAuthGuard)
    let userId = passportUser?.userId ?? passportUser?.sub;

    if (!userId) {
      const authHeader = (req.headers?.authorization ?? req.headers?.Authorization) as string | undefined;
      if (authHeader && typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
        const token = authHeader.slice(7).trim();
        const decoded = jwt.decode(token) as { userId?: string; sub?: string } | null;
        userId = decoded?.userId ?? decoded?.sub;
      }
    }

    if (!userId) throw new ForbiddenException("Missing authenticated user.");

    const user = await this.usersService.findById(userId);
    if (!user) throw new ForbiddenException("User not found.");

    const requiredUpper = requiredRoles.map((r) => String(r).toUpperCase());
    const userRolesUpper = (user.roles ?? [])
      .map((ur: any) => String(ur.role?.code ?? "").toUpperCase())
      .filter(Boolean);

    const allowed = requiredUpper.some((r) => userRolesUpper.includes(r));
    if (!allowed) throw new ForbiddenException("Insufficient permissions.");

    return true;
  }
}
