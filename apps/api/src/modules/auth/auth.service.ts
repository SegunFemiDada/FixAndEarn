import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CurrentUserPayload } from "src/common/types/current-user";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(input: { email: string; fullName: string; password: string }) {
    const existing = await this.usersService.findByEmail(input.email.toLowerCase());
    if (existing) throw new ConflictException("Email already in use.");

    const passwordHash = await argon2.hash(input.password);
    const user = await this.usersService.createUser({
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      passwordHash,
    });

    const token = await this.signAccessToken(user.id);
    return { user: this.toUserResponse(user), accessToken: token };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(input.email.toLowerCase());
    if (!user) throw new UnauthorizedException("Invalid credentials.");

    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials.");

    const token = await this.signAccessToken(user.id);
    return { user: this.toUserResponse(user), accessToken: token };
  }

  async forgotPassword(input: { email: string }) {
    const email = input.email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    const baseResponse: {
      ok: true;
      message: string;
      resetToken?: string;
      resetUrl?: string;
    } = {
      ok: true,
      message:
        "If an account exists for that email, password reset instructions have been generated.",
    };

    if (!user) {
      return baseResponse;
    }

    const resetToken = await this.signResetToken(user.id);

    const allowTokenInResponse =
      this.config.get<string>("AUTH_RETURN_RESET_TOKEN_IN_RESPONSE", "false") === "true";

    if (!allowTokenInResponse) {
      return baseResponse;
    }

    const siteUrlRaw = this.config.get<string>("WEB_APP_URL", "").trim();
    const siteUrl = siteUrlRaw
      ? siteUrlRaw.endsWith("/")
        ? siteUrlRaw.slice(0, -1)
        : siteUrlRaw
      : "http://localhost:3001";

    return {
      ...baseResponse,
      resetToken,
      resetUrl: `${siteUrl}/reset-password?token=${encodeURIComponent(resetToken)}`,
    };
  }

  async resetPassword(input: { token: string; password: string }) {
    const token = input.token.trim();
    if (!token) throw new BadRequestException("RESET_TOKEN_REQUIRED");

    const payload = await this.verifyResetToken(token);
    const userId = String(payload?.sub ?? "").trim();
    const issuedAtSeconds = Number(payload?.iat ?? 0);

    if (!userId || !Number.isFinite(issuedAtSeconds) || issuedAtSeconds <= 0) {
      throw new BadRequestException("INVALID_RESET_TOKEN");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException("INVALID_RESET_TOKEN");
    }

    const issuedAtMs = issuedAtSeconds * 1000;
    const userUpdatedAtMs = new Date(user.updatedAt).getTime();

    if (userUpdatedAtMs > issuedAtMs + 1000) {
      throw new BadRequestException("RESET_TOKEN_EXPIRED");
    }

    const passwordHash = await argon2.hash(input.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
      },
    });

    return {
      ok: true,
      message: "Password reset successful. You can now log in with your new password.",
    };
  }

  private async signAccessToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }

  private async signResetToken(userId: string): Promise<string> {
    const secret =
      this.config.get<string>("JWT_RESET_SECRET") ||
      this.config.get<string>("JWT_ACCESS_SECRET");

    const expiresIn = this.config.get<string>("JWT_RESET_EXPIRES_IN", "15m");

    return this.jwt.signAsync(
      { sub: userId, typ: "password-reset" },
      {
        secret,
        expiresIn,
      }
    );
  }

  private async verifyResetToken(token: string): Promise<Record<string, unknown>> {
    const secret =
      this.config.get<string>("JWT_RESET_SECRET") ||
      this.config.get<string>("JWT_ACCESS_SECRET");

    try {
      return (await this.jwt.verifyAsync(token, { secret })) as Record<string, unknown>;
    } catch {
      throw new BadRequestException("INVALID_OR_EXPIRED_RESET_TOKEN");
    }
  }

  private toUserResponse(user: CurrentUserPayload) {
    const roles = (user.roles ?? []).map((ur: any) => ur.role.code);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
    };
  }
}