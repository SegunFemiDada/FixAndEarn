//path: apps/api/src/admin/exports/admin-exports.controller.ts
import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { AdminRole } from "@prisma/client";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminExportsService } from "./admin-exports.service";
import { ExportAuditLogsDto } from "./dto/export-audit-logs.dto";

@ApiTags("admin-exports")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SECURITY_OFFICER)
@Controller("admin/exports")
export class AdminExportsController {
  constructor(private readonly svc: AdminExportsService) {}

  @Get("audit-logs.csv")
  async auditLogs(@Query() q: ExportAuditLogsDto, @Res() res: Response) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="admin_audit_logs.csv"');

    const stream = this.svc.exportAuditLogsCsv({
      actorAdminId: q.actorAdminId,
      action: q.action,
      from: q.from,
      to: q.to,
      take: q.take
    });

    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  }
}
