// Path: apps/api/src/modules/disputes/admin-disputes.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "../../admin/auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../../admin/auth/admin-roles.guard";
import { AdminRoles } from "../../admin/auth/admin-roles.decorator";
import { AdminRole, DisputeStatus } from "@prisma/client";
import { DisputesService } from "../../modules/disputes/disputes.service";
import { ResolveDisputeDto } from "../../modules/disputes/dto/resolve-dispute.dto";
import { ChatService } from "../../chat/chat.service";
import { AdminDisputeChatMessageDto } from "./dto/admin-dispute-chat-message.dto";

@ApiTags("admin.disputes")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.FINANCE_OFFICER)
@Controller("admin/disputes")
export class AdminDisputesController {
  constructor(
    private readonly disputes: DisputesService,
    private readonly chat: ChatService
  ) {}

  @Get()
  async list(@Query("status") status?: DisputeStatus) {
    return this.disputes.listDisputes(status);
  }

  @Get(":disputeId/chat")
  async getChat(
    @Param("disputeId") disputeId: string,
    @Query("cursor") cursor?: string,
    @Query("take") take?: string
  ) {
    return this.chat.getDisputeConversationForAdmin(disputeId, {
      cursor,
      take: take ? Number(take) : undefined
    });
  }

  @Post(":disputeId/chat/message")
  async sendChatMessage(
    @Req() req: any,
    @Param("disputeId") disputeId: string,
    @Body() dto: AdminDisputeChatMessageDto
  ) {
    const adminId = req.user?.adminId ?? req.user?.sub;

    if (!adminId) {
      throw new UnauthorizedException("ADMIN_ID_MISSING");
    }

    return this.chat.sendAdminMessageToDispute(disputeId, adminId, dto.body);
  }

  @Post(":disputeId/resolve")
  async resolve(@Req() req: any, @Param("disputeId") disputeId: string, @Body() dto: ResolveDisputeDto) {
    const adminId = req.user?.adminId ?? req.user?.sub;

    if (!adminId) {
      throw new UnauthorizedException("ADMIN_ID_MISSING");
    }

    return this.disputes.resolveDispute({
      disputeId,
      adminUserId: adminId,
      resolutionType: dto.resolutionType
    });
  }
}