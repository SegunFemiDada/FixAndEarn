import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminRole } from "@prisma/client";

import { ADMIN_PERMISSIONS_KEY } from "./admin-permissions.decorator";
import {
  ROLE_PERMISSIONS,
  AdminPermission,
} from "./admin-permissions";

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<AdminPermission[]>(
        ADMIN_PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const role = request.user?.role as AdminRole | undefined;

    if (!role) {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[role] ?? [];

    return required.every((permission) =>
      permissions.includes(permission),
    );
  }
}