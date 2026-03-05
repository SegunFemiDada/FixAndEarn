// Path: apps/api/src/modules/jobs/jobs.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { JobsRepo } from "./jobs.repo";
import { LedgerService } from "../wallet/ledger.service";
import { WalletService } from "../wallet/wallet.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class JobsService {
  constructor(
    private readonly repo: JobsRepo,
    private readonly ledgerService: LedgerService,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService
  ) {}

  private ensurePositiveInt(n: number, msg: string) {
    if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(msg);
  }

  private ensureRating(n: number) {
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new BadRequestException("rating must be an integer 1..5.");
    }
  }

  async assertVerifiedUser(userId: string): Promise<void> {
    const rec = await this.repo.findIdentityVerificationByUserId(userId);
    if (!rec) throw new ForbiddenException("Verification required.");
  }

  // ======================================================
  // Marketplace list (OPEN jobs)
  // ======================================================

  async listJobs(query: {
    skill?: string;
    state?: string;
    city?: string;
    minPriceMilliFec?: number;
    maxPriceMilliFec?: number;
    take: number;
    skip: number;
  }) {
    return this.repo.listOpenJobs(query);
  }

  // ======================================================
  // Dashboards
  // ======================================================

  async listMyJobs(args: { clientId: string; status?: string; skip: number; take: number }) {
    await this.assertVerifiedUser(args.clientId);
    return this.repo.listJobsByClientId(args);
  }

  async listMyApplications(args: { fixerId: string; skip: number; take: number }) {
    await this.assertVerifiedUser(args.fixerId);
    return this.repo.listApplicationsByFixerId(args);
  }

  async listJobApplications(args: { jobId: string; clientId: string; skip: number; take: number }) {
    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");

    if (job.clientId !== args.clientId) {
      throw new ForbiddenException("ONLY_JOB_OWNER");
    }

    const skip = args.skip ?? 0;
    const take = args.take ?? 20;

    const [rows, total] = await Promise.all([
      this.repo.listJobApplications(args.jobId, skip, take),
      this.repo.countJobApplications(args.jobId),
    ]);

    return {
  jobId: args.jobId,
  total,
  skip,
  take,
  applications: rows.map((a: any) => {
    const fixer = a.fixer;

    const preferred = fixer?.fixerPreferredAvailability ?? "UNAVAILABLE";
    const busy = Array.isArray(fixer?.jobsAssigned) && fixer.jobsAssigned.length > 0;

    return {
      fixerId: a.fixerId,
      fixer: fixer
        ? {
            id: fixer.id,
            fullName: fixer.fullName,

            availability: {
              preferred,
              effective: busy ? "BUSY" : preferred,
              updatedAt: fixer.fixerAvailabilityUpdatedAt ?? null
            },

            rating: {
              average: typeof fixer.averageRating === "number" ? fixer.averageRating : 0,
              count: typeof fixer.totalRatings === "number" ? fixer.totalRatings : 0
            }
          }
        : null,
      note: a.note,
      status: a.status,
      createdAt: a.createdAt
    };
  })
  };
  }

  // ======================================================
  // Read single job
  // ======================================================

  async getJob(jobId: string) {
    const job = await this.repo.findJobById(jobId);
    if (!job) throw new NotFoundException("Job not found.");
    return job;
  }

  // ======================================================
  // Create job (with posting fee + affordability checks)
  // ======================================================

  async createJob(args: {
    clientId: string;
    skillCategory: string;
    state: string;
    city: string;
    lga?: string;
    area?: string;
    priceMilliFec: number;
  }) {
    this.ensurePositiveInt(args.priceMilliFec, "priceMilliFec must be a positive integer (milliFEC).");
    await this.assertVerifiedUser(args.clientId);

    if (!args.skillCategory || args.skillCategory.trim().length < 2) {
      throw new BadRequestException("skillCategory is required.");
    }
    if (!args.state || !args.city) throw new BadRequestException("state and city are required.");

    const JOB_POST_FEE_MILLI_FEC = 1000;

    const wallet = await this.walletService.getOrCreateWallet(args.clientId);
    const required = args.priceMilliFec + JOB_POST_FEE_MILLI_FEC;

    if (wallet.balanceMilliFec < required) {
      throw new ForbiddenException(
        `INSUFFICIENT_FUNDS_TO_POST_JOB: Need ${(required / 1000).toFixed(
          2
        )} FEC (price + 1.00 FEC posting fee).`
      );
    }

    const job = await this.repo.createJob({
      clientId: args.clientId,
      skillCategory: args.skillCategory.trim(),
      state: args.state.trim(),
      city: args.city.trim(),
      lga: args.lga?.trim() ?? null,
      area: args.area?.trim() ?? null,
      priceMilliFec: args.priceMilliFec,
    });

    await this.ledgerService.addEntry({
      userId: args.clientId,
      type: "FEE",
      direction: "DEBIT",
      amountMilliFec: JOB_POST_FEE_MILLI_FEC,
      idempotencyKey: `job_post_fee:${job.id}`,
      reference: job.id,
      metadata: { kind: "JOB_POSTING_FEE", jobId: job.id },
    });

    return job;
  }

  // ======================================================
  // Update job
  // ======================================================

  async updateJob(args: {
    jobId: string;
    clientId: string;
    patch: Partial<{
      skillCategory: string;
      state: string;
      city: string;
      lga: string;
      area: string;
      priceMilliFec: number;
    }>;
  }) {
    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");

    if (job.clientId !== args.clientId) throw new ForbiddenException("You can only edit your own jobs.");
    if (job.status !== "OPEN") throw new ForbiddenException("Only OPEN jobs can be edited.");

    const appliedCount = await this.repo.countApplications(args.jobId);
    if (appliedCount > 0) throw new ConflictException("Job cannot be edited after a fixer has applied.");

    const data: any = {};
    if (typeof args.patch.skillCategory === "string") data.skillCategory = args.patch.skillCategory.trim();
    if (typeof args.patch.state === "string") data.state = args.patch.state.trim();
    if (typeof args.patch.city === "string") data.city = args.patch.city.trim();
    if (typeof args.patch.lga === "string") data.lga = args.patch.lga.trim();
    if (typeof args.patch.area === "string") data.area = args.patch.area.trim();

    if (typeof args.patch.priceMilliFec === "number") {
      this.ensurePositiveInt(args.patch.priceMilliFec, "priceMilliFec must be a positive integer (milliFEC).");
      data.priceMilliFec = args.patch.priceMilliFec;
    }

    if (Object.keys(data).length === 0) throw new BadRequestException("No valid fields to update.");
    return this.repo.updateJob(args.jobId, data);
  }

  // ======================================================
  // Apply to job
  // ======================================================

  async applyToJob(args: { jobId: string; fixerId: string; note?: string }) {
    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");

    if (job.status !== "OPEN") throw new ForbiddenException("Job is not open for applications.");
    if (job.clientId === args.fixerId) throw new ForbiddenException("You cannot apply to your own job.");

    await this.assertVerifiedUser(args.fixerId);

    const existing = await this.repo.findApplication(args.jobId, args.fixerId);
    if (existing && existing.status === "APPLIED") {
      throw new ConflictException("You already applied to this job.");
    }
    if (existing) throw new ConflictException("You previously interacted with this job application.");

    const created = await this.repo.createApplication({
      jobId: args.jobId,
      fixerId: args.fixerId,
      note: args.note?.trim(),
    });

    // Notify job owner (client)
    try {
      await this.notifications.create({
        userId: job.clientId,
        type: NotificationType.JOB_APPLIED,
        title: "A fixer applied to your job",
        body: "A fixer just applied to your job. Open the job to review applicants.",
        idempotencyKey: `notif:job_applied:${job.id}:${args.fixerId}`,
        data: {
          jobId: job.id,
          fixerId: args.fixerId,
        },
      });
    } catch {}

    return created;
  }

  // ======================================================
  // Completion + Payment + Commission
  // ======================================================

  async requestCompletion(args: { jobId: string; fixerId: string; note?: string }) {
    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");
    if (job.status !== "IN_PROGRESS") throw new ForbiddenException("Job must be IN_PROGRESS to request completion.");

    const agreedFixerId = await this.repo.findAgreedFixerIdForJob(args.jobId);
    if (agreedFixerId !== args.fixerId) throw new ForbiddenException("Only the assigned fixer can request completion.");

    const req = await this.repo.upsertCompletionRequest({
      jobId: args.jobId,
      fixerId: args.fixerId,
      note: args.note?.trim(),
    });

    // Notify client
    try {
      await this.notifications.create({
        userId: job.clientId,
        type: NotificationType.JOB_COMPLETION_REQUESTED,
        title: "Fixer requested job completion",
        body: "Your fixer marked the job as done and requested your review.",
        idempotencyKey: `notif:job_completion_requested:${job.id}`,
        data: {
          jobId: job.id,
          fixerId: args.fixerId,
        },
      });
    } catch {}

    return req;
  }

  async approveCompletion(args: { jobId: string; clientId: string; rating: number; comment?: string }) {
    this.ensureRating(args.rating);

    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");
    if (job.clientId !== args.clientId) throw new ForbiddenException("You can only approve your own job.");
    if (job.status !== "IN_PROGRESS") throw new ForbiddenException("Job must be IN_PROGRESS to approve completion.");

    const completion = await this.repo.findCompletionRequest(args.jobId);
    if (!completion) throw new BadRequestException("No completion request found for this job.");
    if (completion.status === "APPROVED") return { ok: true, status: "ALREADY_APPROVED" };
    if (completion.status !== "PENDING") throw new BadRequestException("Invalid completion request status.");

    const res = await this.repo.approveCompletionAndPay({
      jobId: args.jobId,
      clientId: args.clientId,
      rating: args.rating,
      comment: args.comment?.trim(),
    });

    // Notify fixer
    try {
      const fixerId = (res as any)?.fixerId ?? (job as any)?.fixerId ?? completion.fixerId;
      if (fixerId) {
        await this.notifications.create({
          userId: fixerId,
          type: NotificationType.JOB_COMPLETION_APPROVED,
          title: "Job completion approved",
          body: "Client approved your completion request. Payout is processed.",
          idempotencyKey: `notif:job_completion_approved:${job.id}`,
          data: {
            jobId: job.id,
            clientId: args.clientId,
            rating: args.rating,
          },
        });
      }
    } catch {}

    return res;
  }

  async rejectCompletion(args: { jobId: string; clientId: string; reason?: string }) {
    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");
    if (job.clientId !== args.clientId) throw new ForbiddenException("You can only review your own job.");
    if (job.status !== "IN_PROGRESS") throw new ForbiddenException("Job must be IN_PROGRESS to reject completion.");

    const completion = await this.repo.findCompletionRequest(args.jobId);
    if (!completion) throw new BadRequestException("No completion request found for this job.");
    if (completion.status === "APPROVED") throw new ConflictException("Completion already approved.");
    if (completion.status === "REJECTED") return { ok: true, status: "ALREADY_REJECTED" };
    if (completion.status !== "PENDING") throw new BadRequestException("Invalid completion request status.");

    const res = await this.repo.rejectCompletionRequest({
      jobId: args.jobId,
      clientId: args.clientId,
      reason: args.reason?.trim(),
    });

    // Notify fixer
    try {
      const fixerId = completion.fixerId ?? (job as any)?.fixerId;
      if (fixerId) {
        await this.notifications.create({
          userId: fixerId,
          type: NotificationType.JOB_COMPLETION_REJECTED,
          title: "Job completion rejected",
          body: "Client rejected your completion request. Check their note and continue the job.",
          idempotencyKey: `notif:job_completion_rejected:${job.id}`,
          data: {
            jobId: job.id,
            clientId: args.clientId,
            reason: args.reason?.trim() ?? null,
          },
        });
      }
    } catch {}

    return res;
  }
}