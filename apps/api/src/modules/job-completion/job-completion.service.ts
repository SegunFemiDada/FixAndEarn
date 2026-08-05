// Path: apps/api/src/modules/job-completion/job-completion.service.ts

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { JobCompletionRepo } from "./job-completion.repo";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class JobCompletionService {
  constructor(
    private readonly repo: JobCompletionRepo,
    private readonly notifications: NotificationsService,
  ) {}

  private ensurePositiveInt(n: number, msg: string) {
    if (!Number.isInteger(n) || n <= 0) {
      throw new BadRequestException(msg);
    }
  }

  async requestCompletion(jobId: string, fixerId: string) {
    const job = await this.repo.getJob(jobId);

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    if (job.status !== "IN_PROGRESS") {
      throw new ForbiddenException("JOB_NOT_IN_PROGRESS");
    }

    if (job.fixerId !== fixerId) {
      throw new ForbiddenException("NOT_ASSIGNED_FIXER");
    }

    const result = await this.repo.requestCompletion(jobId);

    try {
      await this.notifications.create({
        userId: job.clientId,
        type: NotificationType.JOB_COMPLETION_REQUESTED,
        title: "Fixer requested job completion",
        body: "Your fixer marked the job as done and requested your review.",
        idempotencyKey: `notif:job_completion_requested:${job.id}`,
        data: {
          jobId: job.id,
          fixerId,
        },
      });
    } catch {}

    return result;
  }

  async rejectCompletion(jobId: string, clientId: string, reason?: string) {
    const job = await this.repo.getJob(jobId);

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    if (job.clientId !== clientId) {
      throw new ForbiddenException("ONLY_CLIENT_CAN_REJECT");
    }

    if (job.status !== "IN_PROGRESS") {
      throw new ForbiddenException("JOB_NOT_IN_PROGRESS");
    }

    const completion = await this.repo.getCompletionRequest(jobId);

    if (!completion) {
      throw new BadRequestException("NO_COMPLETION_REQUEST");
    }

    if (completion.status === "APPROVED") {
      throw new ConflictException("COMPLETION_ALREADY_APPROVED");
    }

    if (completion.status === "REJECTED") {
      return {
        ok: true,
        status: "ALREADY_REJECTED",
      };
    }

    if (completion.status !== "PENDING") {
      throw new BadRequestException("INVALID_COMPLETION_STATUS");
    }

    const result = await this.repo.rejectCompletion(jobId);

    try {
      if (completion.fixerId) {
        await this.notifications.create({
          userId: completion.fixerId,
          type: NotificationType.JOB_COMPLETION_REJECTED,
          title: "Job completion rejected",
          body: "Client rejected your completion request. Continue the job and submit another completion request when finished.",
          idempotencyKey: `notif:job_completion_rejected:${job.id}`,
          data: {
            jobId: job.id,
            clientId,
            reason: reason?.trim() ?? null,
          },
        });
      }
    } catch {}

    return result;
  }

  async approveCompletion(args: {
    jobId: string;
    clientId: string;
    rating: number;
    comment?: string;
  }) {
    const job = await this.repo.getJob(args.jobId);

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    if (job.clientId !== args.clientId) {
      throw new ForbiddenException("ONLY_CLIENT_CAN_APPROVE");
    }

    if (job.status !== "IN_PROGRESS") {
      throw new ForbiddenException("JOB_NOT_IN_PROGRESS");
    }

    if (!job.fixerId) {
      throw new BadRequestException("JOB_HAS_NO_ASSIGNED_FIXER");
    }

    if (!job.lockedPriceMilliFec) {
      throw new BadRequestException("JOB_HAS_NO_LOCKED_PRICE");
    }

    if (!job.completedRequestedAt) {
      throw new ForbiddenException("COMPLETION_NOT_REQUESTED");
    }

    this.ensurePositiveInt(
      job.lockedPriceMilliFec,
      "lockedPriceMilliFec invalid",
    );

    const result = await this.repo.approveAndSettle({
      jobId: args.jobId,
      clientId: args.clientId,
      fixerId: job.fixerId,
      amountMilliFec: job.lockedPriceMilliFec,
      rating: args.rating,
      comment: args.comment?.trim() ?? null,
    });

    try {
      await this.notifications.create({
        userId: job.fixerId,
        type: NotificationType.JOB_COMPLETION_APPROVED,
        title: "Job completion approved",
        body: "Client approved your completion request. Your earnings are now available.",
        idempotencyKey: `notif:job_completion_approved:${job.id}`,
        data: {
          jobId: job.id,
          clientId: args.clientId,
          rating: args.rating,
        },
      });
    } catch {}

    return result;
  }
}