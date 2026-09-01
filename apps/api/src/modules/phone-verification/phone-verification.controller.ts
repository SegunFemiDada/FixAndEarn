import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { PhoneVerificationService } from "./phone-verification.service";
import { Throttle } from "@nestjs/throttler";

@ApiTags("phone-verification")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("phone-verification")
export class PhoneVerificationController {
  constructor(private readonly svc: PhoneVerificationService) {}

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
@Post("send")
async sendCode(
  @CurrentUser() user: { userId: string },
  @Body() body: { phone: string },
) {
  return this.svc.sendCode(user.userId, body.phone);
}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
@Post("verify")
async verifyCode(
  @CurrentUser() user: { userId: string },
  @Body() body: { code: string },
) {
  return this.svc.verifyCode(user.userId, body.code);
}
}