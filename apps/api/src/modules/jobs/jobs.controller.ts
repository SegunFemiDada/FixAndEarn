// Path: apps/api/src/modules/jobs/jobs.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { StorageProvider } from "../../common/storage/storage.provider";
import { JobsService } from "./jobs.service";
import { ApplyJobDto } from "./dto/apply-job.dto";
import { CreateJobDto } from "./dto/create-job.dto";
import { ListJobApplicationsQuery } from "./dto/list-job-applications.query";
import { ListJobsQuery } from "./dto/list-jobs.query";
import { ListMyApplicationsQuery } from "./dto/list-my-applications.query";
import { ListMyJobsQuery } from "./dto/list-my-jobs.query";
import { UpdateJobDto } from "./dto/update-job.dto";
import { UrgentDirectHireDto } from "./dto/urgent-direct-hire.dto";

@ApiTags("jobs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("jobs")
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly storage: StorageProvider
  ) {}

  @Get()
  async list(@Query() q: ListJobsQuery) {
    return this.jobsService.listJobs({
      skill: q.skill,
      state: q.state,
      city: q.city,
      minPriceMilliFec: q.minPriceMilliFec,
      maxPriceMilliFec: q.maxPriceMilliFec,
      skip: q.skip ?? 0,
      take: q.take ?? 20,
    });
  }
  @Get("stats")
async marketplaceStats() {
  return this.jobsService.getMarketplaceStats();
}

  @Get("mine")
  @Roles("CLIENT")
  async mine(
    @CurrentUser() user: { userId: string },
    @Query() q: ListMyJobsQuery
  ) {
    return this.jobsService.listMyJobs({
      clientId: user.userId,
      status: q.status,
      skip: q.skip ?? 0,
      take: q.take ?? 20,
    });
  }

  @Get("applications/mine")
  @Roles("FIXER")
  async myApplications(
    @CurrentUser() user: { userId: string },
    @Query() q: ListMyApplicationsQuery
  ) {
    return this.jobsService.listMyApplications({
      fixerId: user.userId,
      skip: q.skip ?? 0,
      take: q.take ?? 20,
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
      take: q.take ?? 20,
    });
  }

  @Post()
  @Roles("CLIENT")
  @UseInterceptors(
    FileFieldsInterceptor([{ name: "images", maxCount: 5 }])
  )
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateJobDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
    }
  ) {
    const rawImages = files?.images ?? [];

    const allowedImages = rawImages.filter((f) =>
      f.mimetype?.startsWith("image/")
    );

    if (allowedImages.length !== rawImages.length) {
      throw new BadRequestException(
        "Only image files are allowed for job images."
      );
    }

    for (const f of allowedImages) {
      if ((f.size ?? 0) > 2 * 1024 * 1024) {
        throw new BadRequestException("Each job image must be 2MB or less.");
      }
    }

    const imagePaths = await Promise.all(
      allowedImages.map((f) => this.storage.save(f, "jobs"))
    );

    return this.jobsService.createJob({
      clientId: user.userId,
      skillCategory: dto.skillCategory,
      state: dto.state,
      city: dto.city,
      lga: dto.lga,
      area: dto.area,
      priceMilliFec: Number(dto.priceMilliFec),
      imagePaths,
    });
  }

  @Post("urgent-direct-hire")
  @Roles("CLIENT")
  async urgentDirectHire(
    @CurrentUser() user: { userId: string },
    @Body() dto: UrgentDirectHireDto
  ) {
    return this.jobsService.urgentDirectHire({
      clientId: user.userId,
      fixerId: dto.fixerId,
      skillCategory: dto.skillCategory,
      state: dto.state,
      city: dto.city,
      lga: dto.lga,
      area: dto.area,
    });
  }

  @Patch(":id")
  @Roles("CLIENT")
  async update(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: UpdateJobDto
  ) {
    return this.jobsService.updateJob({
      jobId: id,
      clientId: user.userId,
      patch: dto,
    });
  }

  @Post(":id/apply")
  @Roles("FIXER")
  async apply(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: ApplyJobDto
  ) {
    return this.jobsService.applyToJob({
      jobId: id,
      fixerId: user.userId,
      note: dto.note,
    });
  }
}