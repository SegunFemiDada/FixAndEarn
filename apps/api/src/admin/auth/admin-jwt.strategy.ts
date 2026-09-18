//path: apps/api/src/admin/auth/admin-jwt.strategy.ts

import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import {
  ExtractJwt,
  Strategy,
} from "passport-jwt";

import { AdminRepo } from "../admin.repo";

type AdminJwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  typ?: string;
  sv?: number;
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  "admin-jwt",
) {
  constructor(
    private readonly cfg: ConfigService,
    private readonly repo: AdminRepo,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        cfg.getOrThrow<string>(
          "ADMIN_JWT_SECRET",
        ),
    });
  }

  async validate(
    payload: AdminJwtPayload,
  ) {
    const adminId =
      payload?.sub;

    if (!adminId) {
      throw new UnauthorizedException(
        "INVALID_ADMIN_TOKEN",
      );
    }

    const admin =
      await this.repo.findById(
        adminId,
      );

    if (
      !admin ||
      !admin.isActive
    ) {
      throw new UnauthorizedException(
        "ADMIN_INACTIVE",
      );
    }

    if (
      (payload?.sv ?? 1) !==
      admin.sessionVersion
    ) {
      throw new UnauthorizedException(
        "ADMIN_SESSION_EXPIRED",
      );
    }

    return {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };
  }
}