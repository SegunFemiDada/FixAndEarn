import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { ReportsService } from "../../modules/reports/reports.service";
import { Req } from "@nestjs/common";

@ApiTags("admin-reports")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/reports")
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.SECURITY_OFFICER)
  @Get()
  async list() {
    return this.reportsService.findAll();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.SECURITY_OFFICER)
  @Get("pending")
  async pending() {
    return this.reportsService.findPending();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.SECURITY_OFFICER)
  @Post(":id/resolve")
  async resolve(@Req() req: any, @Param("id") id: string) {
    const adminId = req.user.adminId;
    return this.reportsService.resolve(id, adminId);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.SECURITY_OFFICER)
  @Post(":id/dismiss")
  async dismiss(@Req() req: any, @Param("id") id: string) {
    const adminId = req.user.adminId;
    return this.reportsService.dismiss(id, adminId);
  }
}