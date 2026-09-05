import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminSidebarNotificationsService } from "./admin-sidebar-notifications.service";

@Public()
@ApiTags("admin-sidebar-notifications")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/sidebar-notifications")
export class AdminSidebarNotificationsController {
  constructor(
    private readonly svc: AdminSidebarNotificationsService,
  ) {}

  @Get()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER)
  getOverview() {
    return this.svc.getOverview();
  }
}