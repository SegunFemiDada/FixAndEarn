// Path: /apps/api/src/modules/auth/auth.service.ts
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { UsersService } from "../users/users.service";
import { CurrentUserPayload } from "src/common/types/current-user";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService
  ) {}

  async register(input: { email: string; fullName: string; password: string }) {
    const existing = await this.usersService.findByEmail(input.email.toLowerCase());
    if (existing) throw new ConflictException("Email already in use.");

    const passwordHash = await argon2.hash(input.password);
    const user = await this.usersService.createUser({
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      passwordHash
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

  private async signAccessToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }

  private toUserResponse(user: CurrentUserPayload) {
    const roles = (user.roles ?? []).map((ur: any) => ur.role.code);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles
    };
  }
}
