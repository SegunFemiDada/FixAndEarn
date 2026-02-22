import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { JobCompletionRepo } from "./job-completion.repo";
import { JobsRepo } from "../jobs/jobs.repo";

@Injectable()
export class JobCompletionService {
  constructor(private readonly repo: JobCompletionRepo, private readonly jobsRepo: JobsRepo) {}

  private ensurePositiveInt(n: number, msg: string) {
    if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(msg);
  }

  async requestCompletion(jobId: string, fixerId: string) {
    const job = await this.repo.getJob(jobId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    if (job.status !== "IN_PROGRESS") throw new ForbiddenException("JOB_NOT_IN_PROGRESS");
    if (job.fixerId !== fixerId) throw new ForbiddenException("NOT_ASSIGNED_FIXER");

    return this.repo.requestCompletion(jobId);
  }

  async rejectCompletion(jobId: string, clientId: string) {
    const job = await this.repo.getJob(jobId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    if (job.clientId !== clientId) throw new ForbiddenException("ONLY_CLIENT_CAN_REJECT");
    if (job.status !== "IN_PROGRESS") throw new ForbiddenException("JOB_NOT_IN_PROGRESS");

    // reject just clears the request flag (job continues)
    return this.repo.rejectCompletion(jobId);
  }

  async approveCompletion(args: {
    jobId: string;
    clientId: string;
    stars: number;
    comment?: string;
  }) {
    const job = await this.repo.getJob(args.jobId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    if (job.clientId !== args.clientId) throw new ForbiddenException("ONLY_CLIENT_CAN_APPROVE");
    if (job.status !== "IN_PROGRESS") throw new ForbiddenException("JOB_NOT_IN_PROGRESS");
    if (!job.fixerId) throw new BadRequestException("JOB_HAS_NO_ASSIGNED_FIXER");
    if (!job.lockedPriceMilliFec) throw new BadRequestException("JOB_HAS_NO_LOCKED_PRICE");

    // Optional: require fixer requested completion first
    if (!job.completedRequestedAt) throw new ForbiddenException("COMPLETION_NOT_REQUESTED");

    this.ensurePositiveInt(job.lockedPriceMilliFec, "lockedPriceMilliFec invalid");

    return this.repo.approveAndSettle({
      jobId: args.jobId,
      clientId: args.clientId,
      fixerId: job.fixerId,
      amountMilliFec: job.lockedPriceMilliFec,
      stars: args.stars,
      comment: args.comment?.trim() ?? null
    });
  }
}
