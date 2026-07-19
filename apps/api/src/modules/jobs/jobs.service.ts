// Path: apps/api/src/modules/jobs/jobs.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { JobStatus, NotificationType, Prisma } from "@prisma/client";
import { toPublicFileUrl } from "../../common/storage/storage-public-url";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LedgerService } from "../wallet/ledger.service";
import { PlatformWalletService } from "../wallet/platform-wallet.service";
import { WalletService } from "../wallet/wallet.service";
import { JobsRepo } from "./jobs.repo";
import { JobPaymentsService } from "../job-payments/job-payments.service";



@Injectable()
export class JobsService {
  constructor(
  private readonly repo: JobsRepo,
  private readonly ledgerService: LedgerService,
  private readonly walletService: WalletService,
  private readonly notifications: NotificationsService,
  private readonly platformWalletService: PlatformWalletService,
  private readonly prisma: PrismaService,
  @Inject(forwardRef(() => JobPaymentsService))
  private readonly jobPaymentsService: JobPaymentsService
) {}

  private ensurePositiveInt(n: number, msg: string) {
    if (!Number.isInteger(n) || n <= 0) {
      throw new BadRequestException(msg);
    }
  }

  private ensureRating(n: number) {
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new BadRequestException("rating must be an integer 1..5.");
    }
  }

  async assertVerifiedUser(userId: string): Promise<void> {
    const rec = await this.repo.findIdentityVerificationByUserId(userId);
    if (!rec) {
      throw new ForbiddenException("Verification required.");
    }
  }

  private mapJobImage(image: any) {
    return {
      ...image,
      imageUrl: toPublicFileUrl(image?.imagePath),
    };
  }

  private mapJob(job: any) {
    if (!job) return job;

    return {
      ...job,
      images: Array.isArray(job.images)
        ? job.images.map((img: any) => this.mapJobImage(img))
        : [],
    };
  }

  async listJobs(query: {
    skill?: string;
    state?: string;
    city?: string;
    minPriceMilliFec?: number;
    maxPriceMilliFec?: number;
    take: number;
    skip: number;
  }) {
    const jobs = await this.repo.listOpenJobs(query);
    return Array.isArray(jobs) ? jobs.map((job) => this.mapJob(job)) : [];
  }

  async listMyJobs(args: {
    clientId: string;
    status?: string;
    skip: number;
    take: number;
  }) {
    await this.assertVerifiedUser(args.clientId);
    return this.repo.listJobsByClientId(args);
  }

  async urgentDirectHire(args: {
    clientId: string;
    fixerId: string;
    skillCategory: string;
    state: string;
    city: string;
    lga?: string;
    area?: string;
  }) {
    const fixerId = args.fixerId?.trim();
    const skillCategory = args.skillCategory?.trim();
    const state = args.state?.trim();
    const city = args.city?.trim();
    const lga = args.lga?.trim() ?? null;
    const area = args.area?.trim() ?? null;

    if (!fixerId) {
      throw new BadRequestException("FIXER_ID_REQUIRED_FOR_URGENT_HIRE");
    }

    await this.assertVerifiedUser(args.clientId);
    // Prevent hiring yourself
    if (args.fixerId === args.clientId) {
      throw new BadRequestException("YOU_CANNOT_HIRE_YOURSELF");
    }

    if (!skillCategory) {
      throw new BadRequestException("SKILL_CATEGORY_REQUIRED");
    }
    if (!state) {
      throw new BadRequestException("STATE_REQUIRED");
    }
    if (!city) {
      throw new BadRequestException("CITY_REQUIRED");
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {

      const fixer = await tx.user.findFirst({
        where: {
          id: fixerId,
          isActive: true,
          roles: {
            some: {
              role: {
                code: "FIXER",
              },
            },
          },
          verification: {
            is: {
              status: "APPROVED",
            },
          },
        },
        select: { id: true },
      });

      if (!fixer) {
        throw new NotFoundException("FIXER_NOT_FOUND_OR_NOT_VERIFIED");
      }


      const job = await tx.job.create({
        data: {
          clientId: args.clientId,
          fixerId,
          skillCategory,
          state,
          city,
          lga,
          area,
          priceMilliFec: 1,
          status: "DRAFT",
        },
      });

      const payment =
  await this.jobPaymentsService.createUrgentHirePayment({
    jobId: job.id,
    clientId: args.clientId,
    fixerId,
  });

      return {
  ok: true,
  jobId: job.id,
  payment,
};
    });
  }

  async listMyApplications(args: {
    fixerId: string;
    skip: number;
    take: number;
  }) {
    await this.assertVerifiedUser(args.fixerId);
    return this.repo.listApplicationsByFixerId(args);
  }

  async listJobApplications(args: {
    jobId: string;
    clientId: string;
    skip: number;
    take: number;
  }) {
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
        const busy =
          Array.isArray(fixer?.jobsAssigned) && fixer.jobsAssigned.length > 0;

        return {
          fixerId: a.fixerId,
          fixer: fixer
            ? {
                id: fixer.id,
                fullName: fixer.fullName,
                isVerified: fixer?.verification?.status === "APPROVED",
                avatarPath:
                  fixer?.verification?.status === "APPROVED"
                    ? fixer.verification?.selfieImagePath ?? null
                    : null,
                availability: {
                  preferred,
                  effective: busy ? "BUSY" : preferred,
                  updatedAt: fixer.fixerAvailabilityUpdatedAt ?? null,
                },
                rating: {
                  average:
                    typeof fixer.averageRating === "number"
                      ? fixer.averageRating
                      : 0,
                  count:
                    typeof fixer.totalRatings === "number"
                      ? fixer.totalRatings
                      : 0,
                },
              }
            : null,
          note: a.note,
          status: a.status,
          createdAt: a.createdAt,
        };
      }),
    };
  }

  async getJob(jobId: string) {
    const job = await this.repo.findJobById(jobId);
    if (!job) throw new NotFoundException("Job not found.");
    return this.mapJob(job);
  }

  async createJob(args: {
  clientId: string;
  skillCategory: string;
  state: string;
  city: string;
  lga?: string;
  area?: string;
  priceMilliFec: number;
  imagePaths?: string[];
}) {
  this.ensurePositiveInt(
    args.priceMilliFec,
    "priceMilliFec must be a positive integer."
  );

  await this.assertVerifiedUser(args.clientId);

  const job = await this.repo.createJob({
    clientId: args.clientId,
    skillCategory: args.skillCategory.trim(),
    state: args.state.trim(),
    city: args.city.trim(),
    lga: args.lga?.trim() ?? null,
    area: args.area?.trim() ?? null,
    priceMilliFec: args.priceMilliFec,
    status: JobStatus.DRAFT,
  });

  if (args.imagePaths?.length) {
    await this.repo.createJobImages(job.id, args.imagePaths.slice(0, 5));
  }

 const payment = await this.jobPaymentsService.createPostingPayment({
  jobId: job.id,
  clientId: args.clientId,
});

return {
  jobId: job.id,
  payment,
};
}

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

    if (job.clientId !== args.clientId) {
      throw new ForbiddenException("You can only edit your own jobs.");
    }
    if (job.status !== "OPEN") {
      throw new ForbiddenException("Only OPEN jobs can be edited.");
    }

    const appliedCount = await this.repo.countApplications(args.jobId);
    if (appliedCount > 0) {
      throw new ConflictException(
        "Job cannot be edited after a fixer has applied."
      );
    }

    const data: any = {};
    if (typeof args.patch.skillCategory === "string") {
      data.skillCategory = args.patch.skillCategory.trim();
    }
    if (typeof args.patch.state === "string") {
      data.state = args.patch.state.trim();
    }
    if (typeof args.patch.city === "string") {
      data.city = args.patch.city.trim();
    }
    if (typeof args.patch.lga === "string") {
      data.lga = args.patch.lga.trim();
    }
    if (typeof args.patch.area === "string") {
      data.area = args.patch.area.trim();
    }

    if (typeof args.patch.priceMilliFec === "number") {
      this.ensurePositiveInt(
        args.patch.priceMilliFec,
        "priceMilliFec must be a positive integer (milliFEC)."
      );
      data.priceMilliFec = args.patch.priceMilliFec;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No valid fields to update.");
    }

    return this.repo.updateJob(args.jobId, data);
  }

  async applyToJob(args: {
    jobId: string;
    fixerId: string;
    note?: string;
  }) {
    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");

    if (job.status !== "OPEN") {
      throw new ForbiddenException("Job is not open for applications.");
    }
    if (job.clientId === args.fixerId) {
      throw new ForbiddenException("You cannot apply to your own job.");
    }

    await this.assertVerifiedUser(args.fixerId);

    const existing = await this.repo.findApplication(args.jobId, args.fixerId);
    if (existing && existing.status === "APPLIED") {
      throw new ConflictException("You already applied to this job.");
    }
    if (existing) {
      throw new ConflictException(
        "You previously interacted with this job application."
      );
    }

    const created = await this.repo.createApplication({
      jobId: args.jobId,
      fixerId: args.fixerId,
      note: args.note?.trim(),
    });

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

  async requestCompletion(args: {
    jobId: string;
    fixerId: string;
    note?: string;
  }) {
    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");
    if (job.status !== "IN_PROGRESS") {
      throw new ForbiddenException(
        "Job must be IN_PROGRESS to request completion."
      );
    }

    const agreedFixerId = await this.repo.findAgreedFixerIdForJob(args.jobId);
    if (agreedFixerId !== args.fixerId) {
      throw new ForbiddenException(
        "Only the assigned fixer can request completion."
      );
    }

    const req = await this.repo.upsertCompletionRequest({
      jobId: args.jobId,
      fixerId: args.fixerId,
      note: args.note?.trim(),
    });

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

  async approveCompletion(args: {
    jobId: string;
    clientId: string;
    rating: number;
    comment?: string;
  }) {
    this.ensureRating(args.rating);

    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");
    if (job.clientId !== args.clientId) {
      throw new ForbiddenException("You can only approve your own job.");
    }
    if (job.status !== "IN_PROGRESS") {
      throw new ForbiddenException(
        "Job must be IN_PROGRESS to approve completion."
      );
    }

    const completion = await this.repo.findCompletionRequest(args.jobId);
    if (!completion) {
      throw new BadRequestException("No completion request found for this job.");
    }
    if (completion.status === "APPROVED") {
      return { ok: true, status: "ALREADY_APPROVED" };
    }
    if (completion.status !== "PENDING") {
      throw new BadRequestException("Invalid completion request status.");
    }

    const res = await this.repo.approveCompletionAndPay({
      jobId: args.jobId,
      clientId: args.clientId,
      rating: args.rating,
      comment: args.comment?.trim(),
    });

    try {
      const fixerId =
        (res as any)?.fixerId ?? (job as any)?.fixerId ?? completion.fixerId;
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

  async rejectCompletion(args: {
    jobId: string;
    clientId: string;
    reason?: string;
  }) {
    const job = await this.repo.findJobById(args.jobId);
    if (!job) throw new NotFoundException("Job not found.");
    if (job.clientId !== args.clientId) {
      throw new ForbiddenException("You can only review your own job.");
    }
    if (job.status !== "IN_PROGRESS") {
      throw new ForbiddenException(
        "Job must be IN_PROGRESS to reject completion."
      );
    }

    const completion = await this.repo.findCompletionRequest(args.jobId);
    if (!completion) {
      throw new BadRequestException("No completion request found for this job.");
    }
    if (completion.status === "APPROVED") {
      throw new ConflictException("Completion already approved.");
    }
    if (completion.status === "REJECTED") {
      return { ok: true, status: "ALREADY_REJECTED" };
    }
    if (completion.status !== "PENDING") {
      throw new BadRequestException("Invalid completion request status.");
    }

    const res = await this.repo.rejectCompletionRequest({
      jobId: args.jobId,
      clientId: args.clientId,
      reason: args.reason?.trim(),
    });

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