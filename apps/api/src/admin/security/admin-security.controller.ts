import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminSecurityService } from "./admin-security.service";

@ApiTags("admin-security")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/security")
export class AdminSecurityController {
  constructor(private readonly svc: AdminSecurityService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SECURITY_OFFICER)
  @Get("overview")
  async overview(@Query("take") take?: string) {
    const parsedTake = take ? Number(take) : undefined;

    return this.svc.getOverview({
      take: Number.isFinite(parsedTake) ? parsedTake : undefined,
    });
  }
}