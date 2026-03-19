//path: apps/api/src/admin/users/admin-users.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminUserSearchDto } from "./dto/admin-user-search.dto";
import { AdminUserActionDto } from "./dto/admin-user-action.dto";
import { AdminUsersService } from "./admin-users.service";

@ApiTags("admin-users")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly svc: AdminUsersService) {}

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
    AdminRole.VERIFICATION_OFFICER,
    AdminRole.FINANCE_OFFICER
  )
  @Get()
  async search(@Query() q: AdminUserSearchDto) {
    return this.svc.search({ q: q.q, role: q.role, skip: q.skip ?? 0, take: q.take ?? 20 });
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
    AdminRole.VERIFICATION_OFFICER,
    AdminRole.FINANCE_OFFICER
  )
  @Get(":id")
  async getOne(@Req() req: any, @Param("id") id: string) {
    return this.svc.getUser(id, { adminId: req.user.adminId, role: req.user.role });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.SECURITY_OFFICER)
  @Post(":id/suspend")
  async suspend(@Req() req: any, @Param("id") id: string, @Body() dto: AdminUserActionDto) {
    return this.svc.suspend(id, { adminId: req.user.adminId, role: req.user.role }, dto.reason);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.SECURITY_OFFICER)
  @Post(":id/unsuspend")
  async unsuspend(@Req() req: any, @Param("id") id: string, @Body() dto: AdminUserActionDto) {
    return this.svc.unsuspend(id, { adminId: req.user.adminId, role: req.user.role }, dto.reason);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SECURITY_OFFICER)
  @Post(":id/force-reverify")
  async forceReverify(@Req() req: any, @Param("id") id: string, @Body() dto: AdminUserActionDto) {
    return this.svc.forceReverify(id, { adminId: req.user.adminId, role: req.user.role }, dto.reason);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER, AdminRole.SECURITY_OFFICER)
  @Post(":id/notes")
  async notes(@Req() req: any, @Param("id") id: string, @Body() dto: AdminUserActionDto) {
    return this.svc.setNotes(id, { adminId: req.user.adminId, role: req.user.role }, dto.notes);
  }
}
