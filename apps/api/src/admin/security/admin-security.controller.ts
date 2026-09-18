import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminSecurityService } from "./admin-security.service";
import { AdminSecurityInvestigationService } from "./admin-security-investigation.service";

@Public()
@ApiTags("admin-security")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/security")
export class AdminSecurityController {
  constructor(
    private readonly svc: AdminSecurityService,
    private readonly investigation: AdminSecurityInvestigationService,
  ) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SECURITY_OFFICER)
  @Get("overview")
  async overview(@Query("take") take?: string) {
    const parsedTake = take ? Number(take) : undefined;
    return this.svc.getOverview({ take: Number.isFinite(parsedTake) ? parsedTake : undefined });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SECURITY_OFFICER)
  @Get(":id/investigation")
  async investigationById(@Param("id") id: string) {
    return this.investigation.getInvestigation(id);
  }
}