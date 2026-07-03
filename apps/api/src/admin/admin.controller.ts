//path: apps/api/src/admin/admin.controller.ts
import * as crypto from "crypto";
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { AdminJwtAuthGuard } from "./auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "./auth/admin-roles.guard";
import { AdminRoles } from "./auth/admin-roles.decorator";
import { AdminRole } from "@prisma/client";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { AdminAccountActionDto } from "./dto/admin-account-action.dto";
import { Admin2faVerifyDto } from "./dto/admin-2fa-verify.dto";
import { Admin2faRotateDto } from "./dto/admin-2fa-rotate.dto";
import { AdminChangePasswordDto } from "./dto/admin-change-password.dto";
import { Response } from "express";
import { Res } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";

@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly admins: AdminService) {}

  @Get("bootstrap/status")
  async bootstrapStatus() {
    return this.admins.getBootstrapStatus();
  }

  @Post("bootstrap/super-admin")
  async bootstrap(@Body() body: { email: string; fullName: string; password: string }) {
    return this.admins.bootstrapCreateSuperAdmin(body);
  }

  @Post("auth/login")
async login(
  @Req() req: any,
  @Res({ passthrough: true }) res: Response,
  @Body() body: {
    email: string;
    password: string;
    totp: string;
  },
) {
  const result = await this.admins.login({
    email: body.email,
    password: body.password,
    totp: body.totp,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie("admin_refresh", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.cookie("admin_csrf", csrfToken, {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/admin/auth/refresh",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

  return {
    accessToken: result.accessToken,
    admin: result.admin,
  };
}
 @Post("auth/refresh")
async refresh(
  @Req() req: any,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = req.cookies?.admin_refresh;

  const csrfCookie = req.cookies?.admin_csrf;

  const csrfHeader = req.headers["x-admin-csrf"];

  if (
    !csrfCookie ||
    !csrfHeader ||
    csrfCookie !== csrfHeader
  ) {
    throw new UnauthorizedException(
      "INVALID_CSRF_TOKEN",
    );
  }

  const result = await this.admins.refresh({
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const nextCsrf =
    crypto.randomBytes(32).toString("hex");

  res.cookie("admin_refresh", result.refreshToken, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.cookie("admin_csrf", nextCsrf, {
    httpOnly: false,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return {
    accessToken: result.accessToken,
  };
}
@Post("auth/logout")
async logout(
  @Req() req: any,
  @Res({ passthrough: true }) res: Response,
) {
  const refreshToken = req.cookies?.admin_refresh;

  await this.admins.logout(refreshToken);

  res.clearCookie("admin_refresh", {
    path: "/admin/auth/refresh",
  });

  return {
    ok: true,
  };
}
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(
  AdminRole.SUPER_ADMIN,
  AdminRole.SECURITY_OFFICER,
  AdminRole.SUPPORT_OFFICER,
  AdminRole.FINANCE_OFFICER,
  AdminRole.VERIFICATION_OFFICER,
)
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(
  AdminRole.SUPER_ADMIN,
  AdminRole.SECURITY_OFFICER,
  AdminRole.SUPPORT_OFFICER,
  AdminRole.FINANCE_OFFICER,
  AdminRole.VERIFICATION_OFFICER,
)
@Get("auth/sessions")
async mySessions(@Req() req: any) {
  return this.admins.listMySessions(
    req.user.adminId,
  );
}
@Post("auth/logout-all")
async logoutAll(@Req() req: any) {
  return this.admins.logoutAll(req.user.adminId);
}

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SECURITY_OFFICER,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.FINANCE_OFFICER,
    AdminRole.VERIFICATION_OFFICER
  )
  @Get("me")
  async me(@Req() req: any) {
    return { admin: req.user };
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SECURITY_OFFICER,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.FINANCE_OFFICER,
    AdminRole.VERIFICATION_OFFICER
  )
  @Get("2fa/status")
  async own2faStatus(@Req() req: any) {
    return this.admins.getOwn2faStatus(req.user.adminId);
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SECURITY_OFFICER,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.FINANCE_OFFICER,
    AdminRole.VERIFICATION_OFFICER
  )
  @Post("2fa/verify")
  async verifyOwn2fa(@Req() req: any, @Body() body: Admin2faVerifyDto) {
    return this.admins.verifyOwn2fa({
      adminId: req.user.adminId,
      totp: body.totp,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SECURITY_OFFICER,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.FINANCE_OFFICER,
    AdminRole.VERIFICATION_OFFICER
  )
  @Post("2fa/rotate")
  async rotateOwn2fa(@Req() req: any, @Body() body: Admin2faRotateDto) {
    return this.admins.rotateOwn2fa({
      adminId: req.user.adminId,
      reason: body.reason,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Get("admins")
  async listAdmins() {
    return this.admins.listAdmins();
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post("admins")
  async createAdmin(@Req() req: any, @Body() body: CreateAdminDto) {
    return this.admins.createAdmin({
      actorAdminId: req.user.adminId,
      email: body.email,
      fullName: body.fullName,
      password: body.password,
      role: body.role,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post("admins/:id/deactivate")
  async deactivateAdmin(@Req() req: any, @Param("id") id: string, @Body() body: AdminAccountActionDto) {
    return this.admins.deactivateAdmin({
      actorAdminId: req.user.adminId,
      targetAdminId: id,
      reason: body.reason,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post("admins/:id/reactivate")
  async reactivateAdmin(@Req() req: any, @Param("id") id: string, @Body() body: AdminAccountActionDto) {
    return this.admins.reactivateAdmin({
      actorAdminId: req.user.adminId,
      targetAdminId: id,
      reason: body.reason,
    });
  }

  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post("admins/:id/rotate-totp")
  async rotateAdminTotp(@Req() req: any, @Param("id") id: string, @Body() body: AdminAccountActionDto) {
    return this.admins.rotateAdminTotp({
      actorAdminId: req.user.adminId,
      targetAdminId: id,
      reason: body.reason,
    });
  }
  @ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(
  AdminRole.SUPER_ADMIN,
  AdminRole.SECURITY_OFFICER,
  AdminRole.SUPPORT_OFFICER,
  AdminRole.FINANCE_OFFICER,
  AdminRole.VERIFICATION_OFFICER
)
@Post("auth/change-password")
async changePassword(
  @Req() req: any,
  @Body() body: AdminChangePasswordDto
) {
  return this.admins.changePassword({
    adminId: req.user.adminId,
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
    totp: body.totp,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
}
}