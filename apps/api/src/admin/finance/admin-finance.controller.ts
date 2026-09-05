//path: apps/api/src/admin/finance/admin-finance.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { Request } from "express";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminFinanceService } from "./admin-finance.service";
import { ListWithdrawalsDto } from "./dto/list-withdrawals.dto";
import { ReviewWithdrawalDto } from "./dto/review-withdrawal.dto";

type AdminJwtRequest = Request & {
  user: {
    adminId: string;
  };
};

@Public()
@ApiTags("admin-finance")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.FINANCE_OFFICER)
@Controller("admin/finance")
export class AdminFinanceController {
  constructor(private readonly svc: AdminFinanceService) {}

  @Get("withdrawals")
  async listWithdrawals(@Query() q: ListWithdrawalsDto) {
    return this.svc.list({
      status: q.status,
      skip: q.skip ?? 0,
      take: q.take ?? 50,
    });
  }

  @Get("withdrawals/:id")
  async getWithdrawal(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Get("withdrawals/:id/earnings-trace")
  async getWithdrawalEarningsTrace(@Param("id") id: string) {
    return this.svc.getEarningsTrace(id);
  }

  @Post("withdrawals/:id/approve")
  async approve(
    @Req() req: AdminJwtRequest,
    @Param("id") id: string,
    @Body() dto: ReviewWithdrawalDto
  ) {
    return this.svc.approve({
      withdrawalId: id,
      adminId: req.user.adminId,
      note: dto.note,
    });
  }

  @Post("withdrawals/:id/reject")
  async reject(
    @Req() req: AdminJwtRequest,
    @Param("id") id: string,
    @Body() dto: ReviewWithdrawalDto
  ) {
    return this.svc.reject({
      withdrawalId: id,
      adminId: req.user.adminId,
      note: dto.note,
    });
  }

  @Post("withdrawals/:id/paid")
  async paid(
    @Req() req: AdminJwtRequest,
    @Param("id") id: string,
    @Body() dto: ReviewWithdrawalDto
  ) {
    return this.svc.markPaid({
      withdrawalId: id,
      adminId: req.user.adminId,
      note: dto.note,
    });
  }
}