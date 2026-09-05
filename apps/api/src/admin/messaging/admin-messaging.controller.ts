//path: apps/api/src/admin/messaging/admin-messaging.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { Public } from "../../common/auth/public.decorator";
import { AdminMessagingService } from "./admin-messaging.service";
import { ListAdminConversationsDto } from "./dto/list-admin-conversations.dto";
import { AdminDisputeChatMessageDto } from "../../modules/disputes/dto/admin-dispute-chat-message.dto";
import { AdminMessagingConversationActionDto } from "./dto/admin-messaging-conversation-action.dto";
import { AdminMessagingUserActionDto } from "./dto/admin-messaging-user-action.dto";

@Public()
@ApiTags("admin-messaging")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.SECURITY_OFFICER)
@Controller("admin/messaging")
export class AdminMessagingController {
  constructor(private readonly svc: AdminMessagingService) {}

  @Get("conversations")
  async list(@Query() query: ListAdminConversationsDto) {
    return this.svc.listConversations({
      jobId: query.jobId,
      userId: query.userId,
      status: query.status,
      flaggedOnly: Boolean(query.flaggedOnly),
      disputeLinkedOnly: Boolean(query.disputeLinkedOnly),
      skip: query.skip ?? 0,
      take: query.take ?? 20,
    });
  }

  @Get("conversations/:conversationId")
  async getOne(@Param("conversationId") conversationId: string, @Query("take") take?: string) {
    const parsedTake = take ? Number(take) : undefined;

    return this.svc.getConversation(
      conversationId,
      Number.isFinite(parsedTake) ? parsedTake : undefined
    );
  }

  @Post("conversations/:conversationId/messages")
  async sendMessage(
    @Req() req: any,
    @Param("conversationId") conversationId: string,
    @Body() dto: AdminDisputeChatMessageDto
  ) {
    const adminId = req.user?.adminId ?? req.user?.sub;
    if (!adminId) throw new UnauthorizedException("ADMIN_ID_MISSING");

    return this.svc.sendConversationMessage({
      conversationId,
      adminId,
      body: dto.body,
    });
  }

  @Post("conversations/:conversationId/warn")
  async warnConversation(
    @Req() req: any,
    @Param("conversationId") conversationId: string,
    @Body() dto: AdminMessagingConversationActionDto
  ) {
    const adminId = req.user?.adminId ?? req.user?.sub;
    if (!adminId) throw new UnauthorizedException("ADMIN_ID_MISSING");

    return this.svc.warnConversationTargets({
      conversationId,
      adminId,
      target: dto.target,
      reason: dto.reason,
    });
  }

  @Post("conversations/:conversationId/restrict")
  async restrictConversation(
    @Req() req: any,
    @Param("conversationId") conversationId: string,
    @Body() dto: AdminMessagingUserActionDto
  ) {
    const adminId = req.user?.adminId ?? req.user?.sub;
    if (!adminId) throw new UnauthorizedException("ADMIN_ID_MISSING");

    return this.svc.restrictConversation({
      conversationId,
      adminId,
      reason: dto.reason,
    });
  }

  @Post("users/:userId/strike")
  async addStrike(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() dto: AdminMessagingUserActionDto
  ) {
    const adminId = req.user?.adminId ?? req.user?.sub;
    if (!adminId) throw new UnauthorizedException("ADMIN_ID_MISSING");

    return this.svc.addUserStrike({
      userId,
      adminId,
      reason: dto.reason,
    });
  }

  @Post("users/:userId/suspend")
  async suspendUser(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() dto: AdminMessagingUserActionDto
  ) {
    const adminId = req.user?.adminId ?? req.user?.sub;
    if (!adminId) throw new UnauthorizedException("ADMIN_ID_MISSING");

    return this.svc.suspendUser({
      userId,
      adminId,
      reason: dto.reason,
    });
  }

  @Post("users/:userId/unsuspend")
  async unsuspendUser(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() dto: AdminMessagingUserActionDto
  ) {
    const adminId = req.user?.adminId ?? req.user?.sub;
    if (!adminId) throw new UnauthorizedException("ADMIN_ID_MISSING");

    return this.svc.unsuspendUser({
      userId,
      adminId,
      reason: dto.reason,
    });
  }
}