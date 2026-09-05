// Path: apps/api/src/admin/verification/admin-verification.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminRole } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminVerificationService } from "./admin-verification.service";
import { ListPendingVerificationsDto } from "./dto/list-pending.dto";
import { VerificationDecisionDto } from "./dto/verification-decision.dto";

@Public()
@ApiTags("admin-verification")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/verification")
export class AdminVerificationController {
  constructor(private readonly svc: AdminVerificationService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.VERIFICATION_OFFICER, AdminRole.SUPPORT_OFFICER)
  @Get("pending")
  async pending(@Query() q: ListPendingVerificationsDto) {
    return this.svc.listPending(q.skip ?? 0, q.take ?? 20);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.VERIFICATION_OFFICER, AdminRole.SUPPORT_OFFICER)
  @Get(":id")
  async one(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.VERIFICATION_OFFICER)
  @Post(":id/decision")
  async decide(@Req() req: any, @Param("id") id: string, @Body() dto: VerificationDecisionDto) {
    return this.svc.decide({
      verificationId: id,
      adminId: req.user.adminId,
      action: dto.action,
      reason: dto.reason,
      reuploadFields: dto.reuploadFields
    });
  }
}