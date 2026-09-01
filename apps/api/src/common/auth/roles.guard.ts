// Path: apps/api/src/common/auth/roles.guard.ts

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, AppRole } from "./roles.decorator";
import { UsersService } from "../../modules/users/users.service";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // Route does not require a specific role.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    // JwtAuthGuard must run before RolesGuard.
    // We only trust the user placed on the request by Passport.
    const authenticatedUser = req.user as
      | { userId?: string; sub?: string }
      | undefined;

    const userId =
      authenticatedUser?.userId ?? authenticatedUser?.sub;

    if (!userId) {
      throw new ForbiddenException(
        "Missing authenticated user.",
      );
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new ForbiddenException("User not found.");
    }

    const requiredUpper = requiredRoles.map((role) =>
      String(role).toUpperCase(),
    );

    const userRolesUpper = (user.roles ?? [])
      .map((userRole: any) =>
        String(userRole.role?.code ?? "").toUpperCase(),
      )
      .filter(Boolean);

    const allowed = requiredUpper.some((role) =>
      userRolesUpper.includes(role),
    );

    if (!allowed) {
      throw new ForbiddenException(
        "Insufficient permissions.",
      );
    }

    return true;
  }
}