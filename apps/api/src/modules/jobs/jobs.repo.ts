// Path: apps/api/src/modules/jobs/jobs.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma } from "@prisma/client";

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
    const where: Prisma.JobWhereInput = { status: "OPEN" };

    if (query.skill) where.skillCategory = { contains: query.skill, mode: "insensitive" };
    if (query.state) where.state = { equals: query.state, mode: "insensitive" };
    if (query.city) where.city = { equals: query.city, mode: "insensitive" };

    if (typeof query.minPriceMilliFec === "number" || typeof query.maxPriceMilliFec === "number") {
      where.priceMilliFec = {};
      if (typeof query.minPriceMilliFec === "number") (where.priceMilliFec as any).gte = query.minPriceMilliFec;
      if (typeof query.maxPriceMilliFec === "number") (where.priceMilliFec as any).lte = query.maxPriceMilliFec;
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
      where: { jobId_fixerId: { jobId, fixerId } }
    });
  }

  createApplication(data: { jobId: string; fixerId: string; note?: string }) {
    return this.prisma.jobApplication.create({
      data: { jobId: data.jobId, fixerId: data.fixerId, note: data.note ?? null }
    });
  }

  // =========================
  // Dashboards
  // =========================

  listJobsByClientId(args: { clientId: string; status?: string; skip: number; take: number }) {
    const where: Prisma.JobWhereInput = { clientId: args.clientId };
    if (args.status) where.status = args.status as any;

    return this.prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take
    });
  }

  listApplicationsByFixerId(args: { fixerId: string; skip: number; take: number }) {
    return this.prisma.jobApplication.findMany({
      where: { fixerId: args.fixerId },
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
      include: { job: true }
      
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

          // availability (preferred stored on user)
          fixerPreferredAvailability: true,
          fixerAvailabilityUpdatedAt: true,

          // rating aggregate (already on user)
          averageRating: true,
          totalRatings: true,

          // derive BUSY
          jobsAssigned: {
            where: { status: "IN_PROGRESS" },
            select: { id: true },
            take: 1
          }
        }
        
      }
    }
  });
}
  countJobApplications(jobId: string) {
    return this.prisma.jobApplication.count({ where: { jobId } });
  }

  // =========================
  // Milestone G additions
  // =========================

  async findAgreedFixerIdForJob(jobId: string): Promise<string> {
    const convo = await this.prisma.conversation.findFirst({
      where: { jobId, negotiation: { is: { status: "AGREED" } } },
      select: { fixerId: true }
    });
    if (!convo) throw new Error("NO_AGREED_FIXER_FOR_JOB");
    return convo.fixerId;
  }

  findCompletionRequest(jobId: string) {
    return this.prisma.jobCompletionRequest.findUnique({ where: { jobId } });
  }

  async upsertCompletionRequest(args: { jobId: string; fixerId: string; note?: string }) {
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
          reviewedByClientId: null
        },
        create: {
          jobId: args.jobId,
          fixerId: args.fixerId,
          status: "PENDING",
          reviewNote: args.note ?? null,
          requestedAt: now
        }
      });

      await tx.job.update({
        where: { id: args.jobId },
        data: { completedRequestedAt: now }
      });

      return req;
    });
  }

  // =========================
  // Platform + Escrow wallets (AppMeta-backed)
  // =========================

  private async ensurePlatformUserId(tx: Prisma.TransactionClient): Promise<string> {
    const key = "PLATFORM_USER_ID";
    const meta = await tx.appMeta.findUnique({ where: { key } });
    if (meta?.value) return meta.value;

    const platformUser = await tx.user.create({
      data: {
        email: "platform@fixandearn.internal",
        fullName: "FixAndEarn Platform",
        passwordHash: "DISABLED",
        isActive: true
      }
    });

    await tx.wallet.create({ data: { userId: platformUser.id, balanceMilliFec: 0 } });

    await tx.appMeta.upsert({
      where: { key },
      update: { value: platformUser.id },
      create: { key, value: platformUser.id }
    });

    return platformUser.id;
  }

  // Public wrapper so JobsService can credit posting fees to platform wallet
  async getOrCreatePlatformUserId(): Promise<string> {
    return this.prisma.$transaction(async (tx) => this.ensurePlatformUserId(tx));
  }

  private async ensureEscrowUserId(tx: Prisma.TransactionClient): Promise<string> {
    const key = "ESCROW_USER_ID";
    const meta = await tx.appMeta.findUnique({ where: { key } });
    if (meta?.value) return meta.value;

    const escrowUser = await tx.user.create({
      data: {
        email: "escrow@fixandearn.internal",
        fullName: "FixAndEarn Escrow",
        passwordHash: "DISABLED",
        isActive: true
      }
    });

    await tx.wallet.create({ data: { userId: escrowUser.id, balanceMilliFec: 0 } });

    await tx.appMeta.upsert({
      where: { key },
      update: { value: escrowUser.id },
      create: { key, value: escrowUser.id }
    });

    return escrowUser.id;
  }

  private commissionMilliFec(gross: number): number {
    return Math.floor((gross * 10) / 100);
  }

  // =========================
  // Completion payout now pays from ESCROW
  // =========================

async approveCompletionAndPay(args: { jobId: string; clientId: string; rating: number; comment?: string }) {
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
  if (!gross || gross <= 0) throw new Error("INVALID_JOB_PRICE");

  const commission = this.commissionMilliFec(gross);
  const fixerNet = gross - commission;
  if (fixerNet < 0) throw new Error("INVALID_COMMISSION_CALC");

  const payKey = `job_payment:${jobId}`;
  const payoutKey = `job_payout:${jobId}`;
  const commissionKey = `job_commission:${jobId}`;

  const result = await this.prisma.$transaction(async (tx) => {
    const freshJob = await tx.job.findUnique({
      where: { id: jobId },
      select: { status: true, clientId: true },
    });
    if (!freshJob) throw new Error("JOB_NOT_FOUND");
    if (freshJob.clientId !== clientId) throw new Error("ONLY_JOB_OWNER");
    if (freshJob.status !== "IN_PROGRESS") throw new Error("JOB_NOT_IN_PROGRESS");

    const completion = await tx.jobCompletionRequest.findUnique({ where: { jobId } });
    if (!completion) throw new Error("NO_COMPLETION_REQUEST");
    if (completion.status !== "PENDING") throw new Error("INVALID_COMPLETION_STATUS");

    // Idempotency protection
    const alreadyPaid = await tx.ledgerEntry.findUnique({ where: { idempotencyKey: payKey } });

    if (alreadyPaid) {
      await tx.job.update({
        where: { id: jobId },
        data: { status: "COMPLETED", completedApprovedAt: new Date() },
      });

      await tx.jobCompletionRequest.update({
        where: { jobId },
        data: { status: "APPROVED", reviewedByClientId: clientId, reviewedAt: new Date() },
      });

      await tx.jobReview.upsert({
        where: { jobId },
        update: { rating, comment: comment ?? null },
        create: { jobId, clientId, fixerId, rating, comment: comment ?? null },
      });

      // ✅ recalculate fixer aggregates from JobReview
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

      return { ok: true, status: "COMPLETED", alreadyProcessed: true, fixerId };
    }

    const escrowUserId = await this.ensureEscrowUserId(tx);

    const escrowWallet = await tx.wallet.findUnique({ where: { userId: escrowUserId } });
    if (!escrowWallet) throw new Error("ESCROW_WALLET_MISSING");
    if (escrowWallet.balanceMilliFec < gross) throw new Error("ESCROW_INSUFFICIENT_BALANCE");

    const fixerWallet = await tx.wallet.findUnique({ where: { userId: fixerId } });
    if (!fixerWallet) throw new Error("FIXER_WALLET_MISSING");

    const platformUserId = await this.ensurePlatformUserId(tx);
    const platformWallet = await tx.wallet.findUnique({ where: { userId: platformUserId } });
    if (!platformWallet) throw new Error("PLATFORM_WALLET_MISSING");

    // 1) Debit escrow gross
    await tx.ledgerEntry.create({
      data: {
        walletId: escrowWallet.id,
        type: "JOB_PAYMENT",
        direction: "DEBIT",
        amountMilliFec: gross,
        idempotencyKey: payKey,
        reference: jobId,
        metadata: {
          jobId,
          clientId,
          fixerId,
          grossAmountMilliFec: gross,
          source: "ESCROW",
        },
      },
    });

    await tx.wallet.update({
      where: { id: escrowWallet.id },
      data: { balanceMilliFec: { decrement: gross } },
    });

    // 2) Credit fixer net
    await tx.ledgerEntry.create({
      data: {
        walletId: fixerWallet.id,
        type: "JOB_PAYOUT",
        direction: "CREDIT",
        amountMilliFec: fixerNet,
        idempotencyKey: payoutKey,
        reference: jobId,
        metadata: {
          jobId,
          clientId,
          fixerId,
          netAmountMilliFec: fixerNet,
          commissionMilliFec: commission,
          source: "ESCROW",
        },
      },
    });

    await tx.wallet.update({
      where: { id: fixerWallet.id },
      data: { balanceMilliFec: { increment: fixerNet } },
    });

    // 3) Credit platform commission
    await tx.ledgerEntry.create({
      data: {
        walletId: platformWallet.id,
        type: "COMMISSION",
        direction: "CREDIT",
        amountMilliFec: commission,
        idempotencyKey: commissionKey,
        reference: jobId,
        metadata: {
          jobId,
          clientId,
          fixerId,
          commissionMilliFec: commission,
          grossAmountMilliFec: gross,
          source: "ESCROW",
        },
      },
    });

    await tx.wallet.update({
      where: { id: platformWallet.id },
      data: { balanceMilliFec: { increment: commission } },
    });

    // 4) Mark completed + approved
    await tx.jobCompletionRequest.update({
      where: { jobId },
      data: { status: "APPROVED", reviewedByClientId: clientId, reviewedAt: new Date() },
    });

    await tx.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED", completedApprovedAt: new Date() },
    });

    // 5) Review
    await tx.jobReview.upsert({
      where: { jobId },
      update: { rating, comment: comment ?? null },
      create: { jobId, clientId, fixerId, rating, comment: comment ?? null },
    });

    // ✅ recalculate fixer aggregates from JobReview
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
      commissionMilliFec: commission,
      fixerNetMilliFec: fixerNet,
      fixerId,
    };
  });

  if ((result as any).alreadyProcessed) {
    return { ok: true, status: "COMPLETED", alreadyProcessed: true, jobId, fixerId: (result as any).fixerId };
  }

  return { ...result, jobId };
}

  async rejectCompletionRequest(args: { jobId: string; clientId: string; reason?: string }) {
    const { jobId, clientId, reason } = args;

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: jobId }, select: { id: true, status: true, clientId: true } });
      if (!job) throw new Error("JOB_NOT_FOUND");
      if (job.clientId !== clientId) throw new Error("ONLY_JOB_OWNER");
      if (job.status !== "IN_PROGRESS") throw new Error("JOB_NOT_IN_PROGRESS");

      const completion = await tx.jobCompletionRequest.findUnique({ where: { jobId } });
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
          reviewNote: reason ?? null
        }
      });

      await tx.job.update({
        where: { id: jobId },
        data: { completedRequestedAt: null }
      });

      return { ok: true, status: "REJECTED" };
    });
  }
}