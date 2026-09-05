import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminSettingsService } from "./admin-settings.service";
import { UpdateAdminSettingsDto } from "./dto/update-admin-settings.dto";

@Public()
@ApiTags("admin-settings")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/settings")
export class AdminSettingsController {
  constructor(private readonly svc: AdminSettingsService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Get("overview")
  async overview() {
    return this.svc.getOverview();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post("overview")
  async update(@Req() req: any, @Body() body: UpdateAdminSettingsDto) {
    return this.svc.updateOverview({
      adminId: req.user.adminId,
      payload: body,
    });
  }
}