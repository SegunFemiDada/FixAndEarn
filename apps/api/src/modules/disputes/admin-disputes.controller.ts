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
import { AdminRole } from "@prisma/client";
import { DisputesService } from "../../modules/disputes/disputes.service";
import { ResolveDisputeDto } from "../../modules/disputes/dto/resolve-dispute.dto";
import { AdminDisputeChatMessageDto } from "../../modules/disputes/dto/admin-dispute-chat-message.dto";
import { ListAdminDisputesDto } from "../../modules/disputes/dto/list-admin-disputes.dto";

@ApiTags("admin.disputes")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.FINANCE_OFFICER)
@Controller("admin/disputes")
export class AdminDisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Get()
  async list(@Query() query: ListAdminDisputesDto) {
    return this.disputes.listDisputes({
      status: query.status,
      jobId: query.jobId,
    });
  }

  @Get(":disputeId/chat")
  async getChat(@Param("disputeId") disputeId: string, @Query("take") take?: string) {
    const parsedTake = take ? Number(take) : undefined;

    return this.disputes.getAdminDisputeChat({
      disputeId,
      take: Number.isFinite(parsedTake) ? parsedTake : undefined,
    });
  }

  @Post(":disputeId/chat/messages")
  async sendChatMessage(
    @Req() req: any,
    @Param("disputeId") disputeId: string,
    @Body() dto: AdminDisputeChatMessageDto
  ) {
    const adminId = req.user?.adminId ?? req.user?.sub;

    if (!adminId) {
      throw new UnauthorizedException("ADMIN_ID_MISSING");
    }

    return this.disputes.sendAdminDisputeChatMessage({
      disputeId,
      adminUserId: adminId,
      body: dto.body,
    });
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
      resolutionType: dto.resolutionType,
    });
  }

  @Post(":disputeId/resolve-amicably")
  async resolveAmicably(@Req() req: any, @Param("disputeId") disputeId: string) {
    const adminId = req.user?.adminId ?? req.user?.sub;

    if (!adminId) {
      throw new UnauthorizedException("ADMIN_ID_MISSING");
    }

    return this.disputes.resolveDisputeAmicably({
      disputeId,
      adminUserId: adminId,
    });
  }
}