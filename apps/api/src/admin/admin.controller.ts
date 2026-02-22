import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { AdminJwtAuthGuard } from "./auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "./auth/admin-roles.guard";
import { AdminRoles } from "./auth/admin-roles.decorator";
import { AdminRole } from "@prisma/client";

@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly admins: AdminService) {}

  // One-time local bootstrap (disable in prod by env)
  @Post("bootstrap/super-admin")
  async bootstrap(@Body() body: { email: string; fullName: string; password: string }) {
    return this.admins.bootstrapCreateSuperAdmin(body);
  }

  @Post("auth/login")
  async login(@Req() req: any, @Body() body: { email: string; password: string; totp: string }) {
    return this.admins.login({
      email: body.email,
      password: body.password,
      totp: body.totp,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SECURITY_OFFICER, AdminRole.SUPPORT_OFFICER, AdminRole.FINANCE_OFFICER, AdminRole.VERIFICATION_OFFICER)
  @Get("me")
  async me(@Req() req: any) {
    return { admin: req.user };
  }
}
