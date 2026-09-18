import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JobPostingType, JobStatus, JobModerationStatus } from "@prisma/client";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminJobsRepo } from "./admin-jobs.repo";
import { JobModerationService } from "../../modules/jobs/job-moderation.service";

@Injectable()
export class AdminJobsService {
  constructor(
    private readonly repo: AdminJobsRepo,
    private readonly moderation: JobModerationService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(args: {
    q?: string;
    status?: JobStatus;
    moderationStatus?: JobModerationStatus;
    postingType?: JobPostingType;
    clientId?: string;
    fixerId?: string;
    skip?: number;
    take?: number;
  }) {
    const skip = Math.max(0, args.skip ?? 0);
    const take = Math.min(Math.max(1, args.take ?? 20), 100);

    const [result, flaggedTotal] = await Promise.all([
      this.repo.listJobs({
        q: args.q,
        status: args.status,
        moderationStatus: args.moderationStatus,
        postingType: args.postingType,
        clientId: args.clientId,
        fixerId: args.fixerId,
        skip,
        take,
      }),
      this.repo.countFlaggedJobs(),
    ]);

    return {
      ...result,
      flaggedTotal,
    };
  }

  async getOne(jobId: string) {
    const job = await this.repo.getJob(jobId);

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    return job;
  }

  async flag(
    jobId: string,
    adminId: string,
    reason: string,
  ) {
    const updated = await this.moderation.flagJob({
      jobId,
      adminId,
      reason,
    });

    await this.audit.log({
      actorAdminId: adminId,
      action: "JOB_MODERATION_FLAG",
      description: "Admin flagged job for moderation review",
      metadata: {
        jobId,
        reason: reason.trim(),
        moderationStatus: updated.moderationStatus,
      },
    });

    return updated;
  }

  async unflag(
    jobId: string,
    adminId: string,
  ) {
    const updated = await this.moderation.unflagJob(jobId);

    await this.audit.log({
      actorAdminId: adminId,
      action: "JOB_MODERATION_UNFLAG",
      description: "Admin cleared job moderation flag",
      metadata: {
        jobId,
        moderationStatus: updated.moderationStatus,
        status: updated.status,
      },
    });

    return updated;
  }
}
