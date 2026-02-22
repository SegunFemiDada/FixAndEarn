import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "../../admin/auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../../admin/auth/admin-roles.guard";
import { AdminRoles } from "../../admin/auth/admin-roles.decorator";
import { AdminRole, DisputeStatus } from "@prisma/client";
import { DisputesService } from "../../modules/disputes/disputes.service";
import { ResolveDisputeDto } from "../../modules/disputes/dto/resolve-dispute.dto";

@ApiTags("admin.disputes")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.FINANCE_OFFICER)
@Controller("admin/disputes")
export class AdminDisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Get()
  async list(@Query("status") status?: DisputeStatus) {
    return this.disputes.listDisputes(status);
  }

  @Post(":disputeId/resolve")
  async resolve(@Req() req: any, @Param("disputeId") disputeId: string, @Body() dto: ResolveDisputeDto) {
    // AdminJwtStrategy puts admin in req.user. Your token payload uses { sub: admin.id, ... }
const adminId = req.user?.adminId;
    return this.disputes.resolveDispute({
      disputeId,
      adminUserId: adminId,
      resolutionType: dto.resolutionType
    });
  }
}