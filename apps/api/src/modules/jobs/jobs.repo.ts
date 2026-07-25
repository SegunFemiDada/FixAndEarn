//path: apps/api/src/modules/jobs/jobs.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, JobStatus } from "@prisma/client";
@Injectable()
export class JobsRepo {
  constructor(private readonly prisma: PrismaService) {}

  findIdentityVerificationByUserId(userId: string) {
    return this.prisma.identityVerification.findUnique({ where: { userId } });
  }
  createJob(data: {
  clientId: string;
  skillCategory: string;
  state: string;
  city: string;
  lga: string | null;
  area: string | null;
  priceMilliFec: number;
  status: JobStatus;
}) {
  return this.prisma.job.create({ data });
}

  createJobImages(jobId: string, imagePaths: string[]) {
    if (!imagePaths.length) return Promise.resolve([]);

    return this.prisma.jobImage.createMany({
      data: imagePaths.map((imagePath, index) => ({
        jobId,
        imagePath,
        sortOrder: index,
      })),
    });
  }

  findJobById(jobId: string) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        completionRequest: true,
        review: true,
      },
    });
  }

  updateJob(jobId: string, data: any) {
    return this.prisma.job.update({ where: { id: jobId }, data });
  }

  countApplications(jobId: string) {
    return this.prisma.jobApplication.count({ where: { jobId } });
  }

listOpenJobs(query: {
  skill?: string;
  state?: string;
  city?: string;
  minPriceMilliFec?: number;
  maxPriceMilliFec?: number;
  take: number;
  skip: number;
}) {
  const where: Prisma.JobWhereInput = { status: "OPEN", fixerId: null };

  if (query.skill) {
    where.skillCategory = { contains: query.skill, mode: "insensitive" };
  }
  if (query.state) {
    where.state = { contains: query.state, mode: "insensitive" }; // ✅ changed from equals
  }
  if (query.city) {
    where.city = { contains: query.city, mode: "insensitive" };   // ✅ changed from equals
  }

  if (
    typeof query.minPriceMilliFec === "number" ||
    typeof query.maxPriceMilliFec === "number"
  ) {
    where.priceMilliFec = {};
    if (typeof query.minPriceMilliFec === "number") {
      (where.priceMilliFec as any).gte = query.minPriceMilliFec;
    }
    if (typeof query.maxPriceMilliFec === "number") {
      (where.priceMilliFec as any).lte = query.maxPriceMilliFec;
    }
  }

  return this.prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: query.skip,
    take: query.take,
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  });
}

  findApplication(jobId: string, fixerId: string) {
    return this.prisma.jobApplication.findUnique({
      where: { jobId_fixerId: { jobId, fixerId } },
    });
  }

  createApplication(data: { jobId: string; fixerId: string; note?: string }) {
    return this.prisma.jobApplication.create({
      data: {
        jobId: data.jobId,
        fixerId: data.fixerId,
        note: data.note ?? null,
      },
    });
  }

  listJobsByClientId(args: {
    clientId: string;
    status?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.JobWhereInput = { clientId: args.clientId };
    if (args.status) where.status = args.status as any;

    return this.prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
    });
  }

  listApplicationsByFixerId(args: {
    fixerId: string;
    skip: number;
    take: number;
  }) {
    return this.prisma.jobApplication.findMany({
      where: { fixerId: args.fixerId },
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
      include: { job: true },
    });
  }

  async listJobApplications(jobId: string, skip: number, take: number) {
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        jobId: true,
        fixerId: true,
        note: true,
        status: true,
        createdAt: true,
        fixer: {
          select: {
            id: true,
            fullName: true,
            verification: {
              select: {
                status: true,
                selfieImagePath: true,
              },
            },
            fixerPreferredAvailability: true,
            fixerAvailabilityUpdatedAt: true,
            averageRating: true,
            totalRatings: true,
            jobsAssigned: {
              where: { status: "IN_PROGRESS" },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
  }

  countJobApplications(jobId: string) {
    return this.prisma.jobApplication.count({ where: { jobId } });
  }

  async findAgreedFixerIdForJob(jobId: string): Promise<string> {
    const convo = await this.prisma.conversation.findFirst({
      where: { jobId, negotiation: { is: { status: "AGREED" } } },
      select: { fixerId: true },
    });
    if (!convo) throw new Error("NO_AGREED_FIXER_FOR_JOB");
    return convo.fixerId;
  }

  findCompletionRequest(jobId: string) {
    return this.prisma.jobCompletionRequest.findUnique({ where: { jobId } });
  }

  async upsertCompletionRequest(args: {
    jobId: string;
    fixerId: string;
    note?: string;
  }) {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const req = await tx.jobCompletionRequest.upsert({
        where: { jobId: args.jobId },
        update: {
          fixerId: args.fixerId,
          status: "PENDING",
          reviewNote: args.note ?? null,
          requestedAt: now,
          reviewedAt: null,
          reviewedByClientId: null,
        },
        create: {
          jobId: args.jobId,
          fixerId: args.fixerId,
          status: "PENDING",
          reviewNote: args.note ?? null,
          requestedAt: now,
        },
      });

      await tx.job.update({
        where: { id: args.jobId },
        data: { completedRequestedAt: now },
      });

      return req;
    });
  }

  private commissionMilliFec(gross: number): number {
    return Math.floor((gross * 10) / 100);
  }

  async approveCompletionAndPay(args: {
    jobId: string;
    clientId: string;
    rating: number;
    comment?: string;
  }) {
    const { jobId, clientId, rating, comment } = args;

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        clientId: true,
        priceMilliFec: true,
        lockedPriceMilliFec: true,
      },
    });
    if (!job) throw new Error("JOB_NOT_FOUND");

    const fixerId = await this.findAgreedFixerIdForJob(jobId);

    const gross = job.lockedPriceMilliFec ?? job.priceMilliFec;

if (!gross || gross <= 0) {
  throw new Error("INVALID_JOB_PRICE");
}

const platformFee = this.commissionMilliFec(gross);
const fixerNet = gross - platformFee;

if (fixerNet < 0) {
  throw new Error("INVALID_COMMISSION_CALC");
}

const result = await this.prisma.$transaction(async (tx) => {
  const freshJob = await tx.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      clientId: true,
      status: true,
    },
  });

  if (!freshJob) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (freshJob.clientId !== clientId) {
    throw new Error("ONLY_JOB_OWNER");
  }

  if (freshJob.status !== "IN_PROGRESS") {
    throw new Error("JOB_NOT_IN_PROGRESS");
  }

  const completion = await tx.jobCompletionRequest.findUnique({
    where: { jobId },
  });

  if (!completion) {
    throw new Error("NO_COMPLETION_REQUEST");
  }

  if (completion.status !== "PENDING") {
    throw new Error("INVALID_COMPLETION_STATUS");
  }

  const existingEarning = await tx.fixerEarning.findUnique({
    where: {
      jobId,
    },
  });

  const existingRevenue = await tx.platformRevenue.findUnique({
  where: {
    jobId,
  },
});

if (existingEarning || existingRevenue) {
  return {
    ok: true,
    alreadyProcessed: true,
    fixerId,
    status: "COMPLETED",
  };
}

      await tx.fixerEarning.create({
  data: {
    fixerId,
    jobId,
    availableMilliFec: fixerNet,
    status: "AVAILABLE",
  },
});

await tx.platformRevenue.create({
  data: {
    jobId,
    grossMilliFec: gross,
    platformFeeMilliFec: platformFee,
  },
});

      await tx.jobCompletionRequest.update({
        where: { jobId },
        data: {
          status: "APPROVED",
          reviewedByClientId: clientId,
          reviewedAt: new Date(),
        },
      });

      await tx.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completedApprovedAt: new Date(),
        },
      });

      await tx.jobReview.upsert({
        where: { jobId },
        update: { rating, comment: comment ?? null },
        create: { jobId, clientId, fixerId, rating, comment: comment ?? null },
      });

      const agg = await tx.jobReview.aggregate({
        where: { fixerId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.user.update({
        where: { id: fixerId },
        data: {
          averageRating: agg._avg.rating ?? 0,
          totalRatings: agg._count.rating ?? 0,
        },
      });

      await tx.conversation.updateMany({
        where: { jobId, status: "OPEN" },
        data: { status: "CLOSED" },
      });

      return {
        ok: true,
        status: "COMPLETED",
        alreadyProcessed: false,
        grossAmountMilliFec: gross,
        platformFeeMilliFec: platformFee,
        fixerNetMilliFec: fixerNet,
        fixerId,
      };
    });

    if ((result as any).alreadyProcessed) {
      return {
        ok: true,
        status: "COMPLETED",
        alreadyProcessed: true,
        jobId,
        fixerId: (result as any).fixerId,
      };
    }

    return { ...result, jobId };
  }

  async rejectCompletionRequest(args: {
    jobId: string;
    clientId: string;
    reason?: string;
  }) {
    const { jobId, clientId, reason } = args;

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, status: true, clientId: true },
      });
      if (!job) throw new Error("JOB_NOT_FOUND");
      if (job.clientId !== clientId) throw new Error("ONLY_JOB_OWNER");
      if (job.status !== "IN_PROGRESS") throw new Error("JOB_NOT_IN_PROGRESS");

      const completion = await tx.jobCompletionRequest.findUnique({
        where: { jobId },
      });
      if (!completion) throw new Error("NO_COMPLETION_REQUEST");

      if (completion.status !== "PENDING") {
        return { ok: true, status: completion.status };
      }

      await tx.jobCompletionRequest.update({
        where: { jobId },
        data: {
          status: "REJECTED",
          reviewedByClientId: clientId,
          reviewedAt: new Date(),
          reviewNote: reason ?? null,
        },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { completedRequestedAt: null },
      });

      return { ok: true, status: "REJECTED" };
    });
  }
}