//path: apps/api/src/admin/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";

import { DashboardService } from "./dashboard.service";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminPermissionsGuard } from "../auth/admin-permissions.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";

@ApiTags("admin-dashboard")
@ApiBearerAuth()
@Controller("admin/dashboard")
@UseGuards(
  AdminJwtAuthGuard,
  AdminRolesGuard,
  AdminPermissionsGuard,
)
export class DashboardController {
  constructor(
    private readonly dashboard: DashboardService,
  ) {}

  @Get()
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SECURITY_OFFICER,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.FINANCE_OFFICER,
    AdminRole.VERIFICATION_OFFICER,
  )
  async getDashboard() {
    return this.dashboard.getDashboard();
  }
}