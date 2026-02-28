// Path: apps/api/src/modules/fixers/fixers.controller.ts
import { Body, Controller, Get, Patch, UnauthorizedException, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { FixersService } from "./fixers.service";
import { CurrentUserPayload } from "src/common/types/current-user";

@UseGuards(JwtAuthGuard)
@Controller("fixers/me")
export class FixersController {
  constructor(private readonly fixers: FixersService) {}

  private getUserIdOrThrow(user: CurrentUserPayload): string {
    const userId =
      user?.id ??
      user?.userId ??
      user?.sub ?? // common JWT payload field
      user?.payload?.sub ??
      user?.payload?.userId ??
      user?.payload?.id;

    if (!userId || typeof userId !== "string") {
      throw new UnauthorizedException("AUTH_USER_ID_MISSING");
    }
    return userId;
  }

  @Get("availability")
  getAvailability(@CurrentUser() user: CurrentUserPayload) {
    const userId = this.getUserIdOrThrow(user);
    return this.fixers.getMyAvailability(userId);
  }

  @Patch("availability")
  setAvailability(@CurrentUser() user: CurrentUserPayload, @Body() body: { status?: "AVAILABLE" | "UNAVAILABLE" }) {
    const userId = this.getUserIdOrThrow(user);
    return this.fixers.setMyPreferredAvailability(userId, body);
  }
}