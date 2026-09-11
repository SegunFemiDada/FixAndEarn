import { Injectable } from "@nestjs/common";
import {
  JobPostingType,
  JobStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

const JOB_MODERATION_CLEAR = "CLEAR" as const;
const JOB_MODERATION_FLAGGED = "FLAGGED" as const;
export type JobModerationDecision =
  | {
      status: typeof JOB_MODERATION_CLEAR;
      reason: null;
    }
  | {
      status: typeof JOB_MODERATION_FLAGGED;
      reason: string;
    };

@Injectable()
export class JobModerationService {
  constructor(private readonly prisma: PrismaService) {}

  screenJob(input: {
    skillCategory: string;
    state?: string | null;
    city?: string | null;
    lga?: string | null;
    area?: string | null;
  }): JobModerationDecision {
    const haystack = [
      input.skillCategory,
      input.state,
      input.city,
      input.lga,
      input.area,
    ]
      .filter(Boolean)
      .join(" ")
      .trim()
      .toLowerCase();

    const rules: Array<{
      pattern: RegExp;
      reason: string;
    }> = [
      {
        pattern:
          /\b(sell|selling|sale|for sale|buy|buying)\b.*\b(phone|iphone|android|laptop|computer|tv|television|fridge|refrigerator|car|vehicle|shoes|clothes|product|item|goods)\b/i,
        reason: "Jobs for selling or buying goods are not allowed.",
      },
      {
        pattern:
          /\b(sell|selling|for sale)\b.*\b(item|product|goods|device|equipment)\b/i,
        reason: "E-commerce or goods-for-sale listings are not allowed.",
      },
      {
        pattern:
          /\b(ride|taxi|uber|bolt|transport me|transportation|pick me up|drop me|passenger|pickup|dropoff)\b/i,
        reason: "Transportation and ride-booking requests are not allowed.",
      },
      {
        pattern:
          /\b(loan|lend money|borrow money|cash transfer|send money|investment opportunity|double your money|crypto investment)\b/i,
        reason: "Financial solicitation or money-transfer requests are not allowed.",
      },
      {
        pattern:
          /\b(weapon|gun|ammunition|explosive|drugs|stolen|hack|hacking|fraud|scam|counterfeit)\b/i,
        reason: "This job appears to violate FixAndEarn safety or usage rules.",
      },
    ];

    for (const rule of rules) {
      if (rule.pattern.test(haystack)) {
        return {
          status: JOB_MODERATION_FLAGGED,
          reason: rule.reason,
        };
      }
    }

    return {
      status: JOB_MODERATION_CLEAR,
      reason: null,
    };
  }

  async flagJob(args: {
    jobId: string;
    adminId: string;
    reason: string;
  }) {
    const reason = args.reason.trim();

    if (!reason) {
      throw new Error("FLAG_REASON_REQUIRED");
    }

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: args.jobId },
        select: {
          id: true,
          postingType: true,
          fixerId: true,
        },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      const updated = await tx.job.update({
        where: { id: args.jobId },
        data: {
          moderationStatus: JOB_MODERATION_FLAGGED,
          flaggedAt: new Date(),
          flaggedByAdminId: args.adminId,
          flagReason: reason,
        },
      });

      /*
       * If an urgent job is already connected to a fixer,
       * close the conversation immediately. We do not mutate
       * the operational JobStatus here.
       */
      if (
        job.postingType === JobPostingType.URGENT &&
        job.fixerId
      ) {
        await tx.conversation.updateMany({
          where: {
            jobId: job.id,
            fixerId: job.fixerId,
          },
          data: {
            status: "CLOSED",
            active: false,
          },
        });
      }

      return updated;
    });
  }

  async unflagJob(jobId: string) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          clientId: true,
          status: true,
          postingType: true,
          moderationStatus: true,
        },
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      if (job.moderationStatus !== JOB_MODERATION_FLAGGED) {
        return job;
      }

      const successfulPayment =
        await tx.jobPayment.findFirst({
          where: {
            jobId,
            status: "SUCCESS",
            type: {
              in: ["POSTING", "URGENT"],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            type: true,
            fixerId: true,
            conversationId: true,
          },
        });

      const data: Prisma.JobUpdateInput = {
        moderationStatus: JOB_MODERATION_CLEAR,
        flaggedAt: null,
        flaggedByAdminId: null,
        flagReason: null,
      };

      if (
        job.status === JobStatus.DRAFT &&
        successfulPayment?.type === "POSTING"
      ) {
        data.status = JobStatus.OPEN;
      }

      if (
        job.status === JobStatus.DRAFT &&
        successfulPayment?.type === "URGENT" &&
        successfulPayment.fixerId
      ) {
        data.status = JobStatus.OPEN;
        data.fixer = {
        connect: {
            id: successfulPayment.fixerId,
        },
        };
      }

      const updated = await tx.job.update({
        where: { id: jobId },
        data,
      });

      if (
  successfulPayment?.type === "URGENT" &&
  successfulPayment.fixerId &&
  successfulPayment.conversationId &&
  (
    data.status === JobStatus.OPEN ||
    job.status === JobStatus.OPEN ||
    job.status === JobStatus.IN_PROGRESS
  )
) {
  await tx.conversation.update({
    where: {
      id: successfulPayment.conversationId,
    },
    data: {
      status: "OPEN",
      active: true,
    },
  });
}

      return updated;
    });
  }
}