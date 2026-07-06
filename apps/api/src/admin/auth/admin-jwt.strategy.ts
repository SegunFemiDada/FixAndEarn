//path: apps/api/src/admin/auth/admin-jwt.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AdminRepo } from "../admin.repo";

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, "admin-jwt") {
  constructor(
    private readonly cfg: ConfigService,
    private readonly repo: AdminRepo
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.get<string>(
        "ADMIN_JWT_SECRET",
        "dev_admin_secret_change_me"
      ),
    });
  }

  async validate(payload: any) {
  const adminId = payload?.sub;
  if (!adminId) {
    throw new UnauthorizedException("INVALID_ADMIN_TOKEN");
  }

  const admin = await this.repo.findById(adminId);

  if (!admin || !admin.isActive) {
    throw new UnauthorizedException("ADMIN_INACTIVE");
  }

  if ((payload?.sv ?? 1) !== admin.sessionVersion) {
    throw new UnauthorizedException("ADMIN_SESSION_EXPIRED");
  }

  return {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  };
}
}
