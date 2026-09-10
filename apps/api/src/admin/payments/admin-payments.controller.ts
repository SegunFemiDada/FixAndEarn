import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  AdminRole,
} from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminPaymentsService } from "./admin-payments.service";
import { AdminPaymentSearchDto } from "./dto/admin-payment-search.dto";

@Public()
@ApiTags("admin-payments")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(
  AdminRole.SUPER_ADMIN,
  AdminRole.FINANCE_OFFICER,
  AdminRole.SUPPORT_OFFICER,
)
@Controller("admin/payments")
export class AdminPaymentsController {
  constructor(
    private readonly svc: AdminPaymentsService,
  ) {}

  @Get()
  async list(
    @Query() query: AdminPaymentSearchDto,
  ) {
    return this.svc.list({
      q: query.q,
      status: query.status,
      type: query.type,
      jobId: query.jobId,
      clientId: query.clientId,
      fixerId: query.fixerId,
      skip: query.skip,
      take: query.take,
    });
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }
}