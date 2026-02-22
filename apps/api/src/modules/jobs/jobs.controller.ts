import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { JobsService } from "./jobs.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { ApplyJobDto } from "./dto/apply-job.dto";
import { ListJobsQuery } from "./dto/list-jobs.query";
import { RequestCompletionDto } from "./dto/request-completion.dto";
import { ApproveCompletionDto } from "./dto/approve-completion.dto";
import { RejectCompletionDto } from "./dto/reject-completion.dto";
import { ListMyJobsQuery } from "./dto/list-my-jobs.query";
import { ListMyApplicationsQuery } from "./dto/list-my-applications.query";
import { ListJobApplicationsQuery } from "./dto/list-job-applications.query";


@ApiTags("jobs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Marketplace list (OPEN jobs only)
  @Get()
  async list(@Query() q: ListJobsQuery) {
    return this.jobsService.listJobs({
      skill: q.skill,
      state: q.state,
      city: q.city,
      minPriceMilliFec: q.minPriceMilliFec,
      maxPriceMilliFec: q.maxPriceMilliFec,
      skip: q.skip ?? 0,
      take: q.take ?? 20
    });
  }
// CLIENT dashboard: my jobs (all statuses)
@Get("mine")
@Roles("CLIENT")
async mine(@CurrentUser() user: { userId: string }, @Query() q: ListMyJobsQuery) {
  return this.jobsService.listMyJobs({
    clientId: user.userId,
    status: q.status,
    skip: q.skip ?? 0,
    take: q.take ?? 20
  });
}

// FIXER dashboard: my applications (includes job)
@Get("applications/mine")
@Roles("FIXER")
async myApplications(@CurrentUser() user: { userId: string }, @Query() q: ListMyApplicationsQuery) {
  return this.jobsService.listMyApplications({
    fixerId: user.userId,
    skip: q.skip ?? 0,
    take: q.take ?? 20
  });
}

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.jobsService.getJob(id);
  }
 @Get(":id/applications")
  @Roles("CLIENT")
  async applications(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Query() q: ListJobApplicationsQuery
  ) {
    return this.jobsService.listJobApplications({
      jobId: id,
      clientId: user.userId,
      skip: q.skip ?? 0,
      take: q.take ?? 20
    });
  }
  // Only verified CLIENT can create
  @Post()
  @Roles("CLIENT")
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateJobDto) {
    return this.jobsService.createJob({
      clientId: user.userId,
      skillCategory: dto.skillCategory,
      state: dto.state,
      city: dto.city,
      lga: dto.lga,
      area: dto.area,
      priceMilliFec: dto.priceMilliFec
    });
  }

  // Client can edit until a fixer applies
  @Patch(":id")
  @Roles("CLIENT")
  async update(@CurrentUser() user: { userId: string }, @Param("id") id: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.updateJob({
      jobId: id,
      clientId: user.userId,
      patch: dto
    });
  }

  // Fixer applies (job interest)
  @Post(":id/apply")
  @Roles("FIXER")
  async apply(@CurrentUser() user: { userId: string }, @Param("id") id: string, @Body() dto: ApplyJobDto) {
    return this.jobsService.applyToJob({
      jobId: id,
      fixerId: user.userId,
      note: dto.note
    });
  }

  // ==========================
  // Milestone G: Completion flow
  // ==========================

  // Fixer requests completion (job must be IN_PROGRESS)
  @Post(":id/completion/request")
  @Roles("FIXER")
  async requestCompletion(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: RequestCompletionDto
  ) {
    return this.jobsService.requestCompletion({
      jobId: id,
      fixerId: user.userId,
      note: dto.note
    });
  }

  // Client approves completion + pays + rates (ledger-only)
  @Post(":id/completion/approve")
  @Roles("CLIENT")
  async approveCompletion(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: ApproveCompletionDto
  ) {
    return this.jobsService.approveCompletion({
      jobId: id,
      clientId: user.userId,
      rating: dto.rating,
      comment: dto.comment
    });
  }
    // Client rejects completion request (no payout)
  @Post(":id/completion/reject")
  @Roles("CLIENT")
  async rejectCompletion(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: RejectCompletionDto
  ) {
    return this.jobsService.rejectCompletion({
      jobId: id,
      clientId: user.userId,
      reason: dto.reason
    });
  }

}
