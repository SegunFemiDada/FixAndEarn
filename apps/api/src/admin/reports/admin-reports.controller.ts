import { Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { ReportsService } from "../../modules/reports/reports.service";
import { AdminAuditService } from "../audit/admin-audit.service";

@Public()
@ApiTags("admin-reports")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/reports")
export class AdminReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly audit: AdminAuditService,
  ) {}

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
  )
  @Get()
  async list() {
    return this.reportsService.findAll();
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
  )
  @Get("pending")
  async pending() {
    return this.reportsService.findPending();
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
  )
  @Get(":id/investigation")
  async investigation(@Param("id") id: string) {
    return this.reportsService.getInvestigation(id);
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
  )
  @Post(":id/resolve")
  async resolve(@Req() req: any, @Param("id") id: string) {
    const adminId = req.user.adminId;

    const result = await this.reportsService.resolve(id, adminId);

    await this.audit.log({
      actorAdminId: adminId,
      action: "REPORT_RESOLVE",
      description: "Resolved report",
      metadata: {
        reportId: id,
        status: result.status,
      },
    });

    return result;
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
  )
  @Post(":id/dismiss")
  async dismiss(@Req() req: any, @Param("id") id: string) {
    const adminId = req.user.adminId;

    const result = await this.reportsService.dismiss(id, adminId);

    await this.audit.log({
      actorAdminId: adminId,
      action: "REPORT_DISMISS",
      description: "Dismissed report",
      metadata: {
        reportId: id,
        status: result.status,
      },
    });

    return result;
  }
}