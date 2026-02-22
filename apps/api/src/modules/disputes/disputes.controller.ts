import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { OpenDisputeDto } from "./dto/open-dispute.dto";
import { DisputesService } from "./disputes.service";

@ApiTags("disputes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("jobs/:jobId/disputes")
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Post()
  async open(
    @Param("jobId") jobId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: OpenDisputeDto
  ) {
    return this.disputes.openDispute({
      jobId,
      actorUserId: user.userId,
      reason: dto.reason,
      evidence: dto.evidence
    });
  }

  @Get()
  async get(@Param("jobId") jobId: string, @CurrentUser() user: { userId: string }) {
    return this.disputes.getDispute(jobId, user.userId);
  }
}