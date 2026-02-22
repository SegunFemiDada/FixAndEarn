import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JobCompletionService } from "./job-completion.service";
import { RequestCompletionDto } from "./dto/request-completion.dto";
import { ApproveCompletionDto } from "./dto/approve-completion.dto";

@ApiTags("job-completion")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("jobs")
export class JobCompletionController {
  constructor(private readonly svc: JobCompletionService) {}

  // Fixer requests completion
  @Post(":id/complete/request")
  @Roles("FIXER")
  async request(@CurrentUser() u: { userId: string }, @Param("id") jobId: string, @Body() _dto: RequestCompletionDto) {
    return this.svc.requestCompletion(jobId, u.userId);
  }

  // Client rejects completion request
  @Post(":id/complete/reject")
  @Roles("CLIENT")
  async reject(@CurrentUser() u: { userId: string }, @Param("id") jobId: string) {
    return this.svc.rejectCompletion(jobId, u.userId);
  }

  // Client approves completion -> payment + payout + commission + rating
  @Post(":id/complete/approve")
  @Roles("CLIENT")
  async approve(@CurrentUser() u: { userId: string }, @Param("id") jobId: string, @Body() dto: ApproveCompletionDto) {
    return this.svc.approveCompletion({
      jobId,
      clientId: u.userId,
      stars: dto.stars,
      comment: dto.comment
    });
  }
}
