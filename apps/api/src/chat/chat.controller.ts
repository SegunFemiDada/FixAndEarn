import { Body, Controller, Headers, Param, Post, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { AcceptAgreementDto } from "./dto/accept-agreement.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { ProposePriceDto } from "./dto/propose-price.dto";
import { LockPriceDto } from "./dto/lock-price.dto";
import { RespondLockedPriceDto } from "./dto/respond-locked-price.dto";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { CurrentUserPayload } from "src/common/types/current-user";

// ...existing code...
function pickUserId(user: any): string {
  const id =
    user?.userId ??
    user?.id ??
    user?.sub ??
    user?.payload?.userId ??
    user?.payload?.id ??
    user?.payload?.sub;

  if (!id) throw new Error("CURRENT_USER_ID_MISSING");
  return id;
}
// ...existing code...

@UseGuards(JwtAuthGuard)
@Controller("jobs/:jobId/chats/:fixerId")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post("agreement")
  async acceptAgreement(
    @Param("jobId") jobId: string,
    @Param("fixerId") fixerId: string,
    @Body() dto: AcceptAgreementDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers("x-forwarded-for") xff?: string,
    @Headers("user-agent") ua?: string
  ) {
    const ip = (xff || "").split(",")[0]?.trim() || undefined;
    const userId = pickUserId(user);
    return this.chat.acceptAgreement(jobId, fixerId, userId, dto.accepted, ip, ua);
  }

  @Post("messages")
  async sendMessage(
    @Param("jobId") jobId: string,
    @Param("fixerId") fixerId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers("x-forwarded-for") xff?: string,
    @Headers("user-agent") ua?: string
  ) {
    const ip = (xff || "").split(",")[0]?.trim() || undefined;
    const userId = pickUserId(user);
    return this.chat.sendMessage(jobId, fixerId, userId, dto.body, ip, ua);
  }

  @Post("negotiation/propose")
  async propose(
    @Param("jobId") jobId: string,
    @Param("fixerId") fixerId: string,
    @Body() dto: ProposePriceDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    const userId = pickUserId(user);
    return this.chat.propose(jobId, fixerId, userId, dto.proposedPriceMilliFec);
  }

  @Post("negotiation/lock")
  async lock(
    @Param("jobId") jobId: string,
    @Param("fixerId") fixerId: string,
    @Body() dto: LockPriceDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    const userId = pickUserId(user);
    return this.chat.lock(jobId, fixerId, userId, dto.lockedPriceMilliFec);
  }

  @Post("negotiation/respond")
  async respondLocked(
    @Param("jobId") jobId: string,
    @Param("fixerId") fixerId: string,
    @Body() dto: RespondLockedPriceDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    const userId = pickUserId(user);
    return this.chat.respondLocked(jobId, fixerId, userId, dto.accept);
  }
}
