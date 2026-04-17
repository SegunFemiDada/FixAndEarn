//path: apps/api/src/admin/content/admin-content.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminContentService } from "./admin-content.service";
import { UpdateAdminContentDto } from "./dto/update-admin-content.dto";

@ApiTags("admin-content")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/content")
export class AdminContentController {
  constructor(private readonly svc: AdminContentService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER)
  @Get("overview")
  async overview() {
    return this.svc.getOverview();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER)
  @Post("overview")
  async update(@Req() req: any, @Body() body: UpdateAdminContentDto) {
    return this.svc.updateOverview({
      adminId: req.user.adminId,
      payload: body,
    });
  }
}