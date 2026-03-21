import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminAnalyticsService } from "./admin-analytics.service";
import { GetAdminAnalyticsDto } from "./dto/get-admin-analytics.dto";

@ApiTags("admin-analytics")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/analytics")
export class AdminAnalyticsController {
  constructor(private readonly svc: AdminAnalyticsService) {}

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.FINANCE_OFFICER,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER
  )
  @Get("overview")
  async overview(@Query() query: GetAdminAnalyticsDto) {
    return this.svc.getOverview(query.range ?? "week");
  }
}