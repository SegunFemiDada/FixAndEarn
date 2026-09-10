import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminJobsService } from "./admin-jobs.service";
import { AdminJobSearchDto } from "./dto/admin-job-search.dto";

@Public()
@ApiTags("admin-jobs")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(
  AdminRole.SUPER_ADMIN,
  AdminRole.SUPPORT_OFFICER,
  AdminRole.SECURITY_OFFICER,
  AdminRole.VERIFICATION_OFFICER,
  AdminRole.FINANCE_OFFICER
)
@Controller("admin/jobs")
export class AdminJobsController {
  constructor(private readonly svc: AdminJobsService) {}

  @Get()
  async list(@Query() query: AdminJobSearchDto) {
    return this.svc.list({
      q: query.q,
      status: query.status,
      postingType: query.postingType,
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