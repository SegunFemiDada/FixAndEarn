//path: apps/api/src/modules/earnings/earnings.controller.ts
import {
  Controller,
  Get,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { EarningsService } from "./earnings.service";

@ApiTags("earnings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("earnings")
export class EarningsController {
  constructor(
    private readonly earningsService: EarningsService,
  ) {}

  /**
   * Current available earnings
   */
  @Get("available")
  @Roles("FIXER")
  async available(
    @CurrentUser() user: { userId: string },
  ) {
    return this.earningsService.getAvailableBalance(
      user.userId,
    );
  }

  /**
   * Earnings summary
   */
  @Get("summary")
  @Roles("FIXER")
  async summary(
    @CurrentUser() user: { userId: string },
  ) {
    return this.earningsService.getSummary(
      user.userId,
    );
  }

  /**
   * Earnings history
   */
  @Get("history")
  @Roles("FIXER")
  async history(
    @CurrentUser() user: { userId: string },
  ) {
    return this.earningsService.getHistory(
      user.userId,
    );
  }

  /**
   * Single earning by job
   */
  @Get("job/:jobId")
  @Roles("FIXER", "SUPER_ADMIN")
  async byJob(
    @Param("jobId") jobId: string,
  ) {
    return this.earningsService.getEarningByJob(
      jobId,
    );
  }
}