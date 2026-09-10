import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DisputeStatus, JobStatus, NotificationType, Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async openDispute(args: {
    jobId: string;
    actorUserId: string;
    reason: string;
    evidence?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  }) {
    const {
      jobId,
      actorUserId,
      reason,
      evidence,
    } = args;

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    const isClient = job.clientId === actorUserId;
    const isFixer = job.fixerId === actorUserId;

    if (!isClient && !isFixer) {
      throw new ForbiddenException("NOT_JOB_PARTY");
    }

    if (job.status !== JobStatus.IN_PROGRESS) {
      throw new BadRequestException(
        "DISPUTE_ONLY_ALLOWED_IN_PROGRESS",
      );
    }

    const existing = await this.prisma.dispute.findUnique({
      where: { jobId },
    });

    if (existing?.status === DisputeStatus.OPEN) {
      throw new BadRequestException("DISPUTE_ALREADY_OPEN");
    }

    const dispute = await this.prisma.$transaction(
      async (tx) => {
        const created = await tx.dispute.create({
          data: {
            jobId,
            openedByUserId: actorUserId,
            reason,
            evidence,
          },
        });

        await tx.job.update({
          where: { id: jobId },
          data: {
            status: JobStatus.DISPUTED,
          },
        });

        const recipients = [
          job.clientId,
          job.fixerId,
        ].filter(Boolean) as string[];

        await Promise.all(
          recipients.map((uid) =>
            this.notifications.create({
              userId: uid,
              type: NotificationType.DISPUTE_OPENED,
              title: "Dispute opened",
              body:
                "A dispute has been opened for this job. Admin will review and resolve.",
              data: {
                jobId,
                disputeId: created.id,
              },
              idempotencyKey:
                `notify:dispute_opened:${created.id}:${uid}`,
              prisma: tx,
            }),
          ),
        );

        return created;
      },
    );

    return {
      ok: true,
      disputeId: dispute.id,
    };
  }

  async getDispute(
    jobId: string,
    actorUserId: string,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    const isClient = job.clientId === actorUserId;
    const isFixer = job.fixerId === actorUserId;

    if (!isClient && !isFixer) {
      throw new ForbiddenException("NOT_JOB_PARTY");
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { jobId },
    });

    return {
      dispute,
    };
  }

  async listDisputes(args?: {
    status?: DisputeStatus;
    jobId?: string;
  }) {
    const where: Prisma.DisputeWhereInput = {};

    if (args?.status) {
      where.status = args.status;
    }

    if (args?.jobId?.trim()) {
      where.jobId = args.jobId.trim();
    }

    const disputes = await this.prisma.dispute.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        job: true,
      },
    });

    return {
      disputes,
    };
  }

  async resolveDisputeAmicably(args: {
    disputeId: string;
    adminUserId: string;
  }) {
    const {
      disputeId,
      adminUserId,
    } = args;

    return this.prisma.$transaction(
      async (tx) => {
        const dispute = await tx.dispute.findUnique({
          where: {
            id: disputeId,
          },
          include: {
            job: true,
          },
        });

        if (!dispute) {
          throw new NotFoundException(
            "DISPUTE_NOT_FOUND",
          );
        }

        if (
          dispute.status !==
          DisputeStatus.OPEN
        ) {
          return {
            ok: true,
            status: dispute.status,
          };
        }

        const job = dispute.job;

        if (!job) {
          throw new BadRequestException(
            "DISPUTE_JOB_MISSING",
          );
        }

        if (!job.fixerId) {
          throw new BadRequestException(
            "DISPUTE_JOB_FIXER_MISSING",
          );
        }

        /*
         * Amicable resolution does not settle, refund,
         * release, transfer, or otherwise move customer funds.
         *
         * It simply closes the dispute and returns the job
         * to its normal IN_PROGRESS state so the existing
         * completion flow can be used again.
         */
        await tx.dispute.update({
          where: {
            id: disputeId,
          },
          data: {
            status: DisputeStatus.RESOLVED,
            resolvedByAdminId: adminUserId,
            resolvedAt: new Date(),
          },
        });

        await tx.job.update({
          where: {
            id: job.id,
          },
          data: {
            status: JobStatus.IN_PROGRESS,
            completedRequestedAt: null,
          },
        });

        await tx.jobCompletionRequest.updateMany({
          where: {
            jobId: job.id,
          },
          data: {
            status: "REJECTED",
            reviewedAt: new Date(),
            reviewNote:
              "Admin resolved dispute amicably. Fixer may request completion again.",
          },
        });

        const recipients = [
          job.clientId,
          job.fixerId,
        ].filter(Boolean) as string[];

        await Promise.all(
          recipients.map((uid) =>
            this.notifications.create({
              userId: uid,
              type:
                NotificationType.DISPUTE_RESOLVED,
              title:
                "Dispute resolved amicably",
              body:
                "Admin resolved the dispute amicably. The fixer can request completion again.",
              data: {
                jobId: job.id,
                disputeId,
                mode: "AMICABLE",
              },
              idempotencyKey:
                `notify:dispute_resolved_amicably:${disputeId}:${uid}`,
              prisma: tx,
            }),
          ),
        );

        return {
          ok: true,
          status: "RESOLVED" as const,
          mode: "AMICABLE" as const,
        };
      },
    );
  }

  async getAdminDisputeChat(args: {
    disputeId: string;
    take?: number;
  }) {
    const take = Math.max(
      1,
      Math.min(args.take ?? 50, 100),
    );

    const dispute =
      await this.prisma.dispute.findUnique({
        where: {
          id: args.disputeId,
        },
        include: {
          job: {
            select: {
              id: true,
              clientId: true,
              fixerId: true,
            },
          },
        },
      });

    if (!dispute) {
      throw new NotFoundException(
        "DISPUTE_NOT_FOUND",
      );
    }

    if (!dispute.job?.fixerId) {
      throw new BadRequestException(
        "DISPUTE_JOB_FIXER_MISSING",
      );
    }

    const conversation =
      await this.prisma.conversation.findUnique({
        where: {
          jobId_fixerId: {
            jobId: dispute.job.id,
            fixerId: dispute.job.fixerId,
          },
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
            take,
            include: {
              flags: true,
            },
          },
        },
      });

    if (!conversation) {
      return {
        dispute: {
          id: dispute.id,
          jobId: dispute.job.id,
        },
        conversation: null,
        messages: [],
      };
    }

    return {
      dispute: {
        id: dispute.id,
        jobId: dispute.job.id,
      },
      conversation: {
        id: conversation.id,
        jobId: conversation.jobId,
        fixerId: conversation.fixerId,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: conversation.messages.map(
        (message) => ({
          id: message.id,
          senderId: message.senderId,
          body: message.body,
          createdAt: message.createdAt,
          flags: (message.flags ?? []).map(
            (flag) => ({
              id: flag.id,
              type: flag.type,
              matched: flag.matched,
              createdAt: flag.createdAt,
            }),
          ),
        }),
      ),
    };
  }

  async sendAdminDisputeChatMessage(args: {
    disputeId: string;
    adminUserId: string;
    body: string;
  }) {
    const body = String(
      args.body ?? "",
    ).trim();

    if (!body) {
      throw new BadRequestException(
        "MESSAGE_BODY_REQUIRED",
      );
    }

    const dispute =
      await this.prisma.dispute.findUnique({
        where: {
          id: args.disputeId,
        },
        include: {
          job: {
            select: {
              id: true,
              clientId: true,
              fixerId: true,
              status: true,
            },
          },
        },
      });

    if (!dispute) {
      throw new NotFoundException(
        "DISPUTE_NOT_FOUND",
      );
    }

    if (!dispute.job?.fixerId) {
      throw new BadRequestException(
        "DISPUTE_JOB_FIXER_MISSING",
      );
    }

    const conversation =
      await this.prisma.conversation.findUnique({
        where: {
          jobId_fixerId: {
            jobId: dispute.job.id,
            fixerId: dispute.job.fixerId,
          },
        },
      });

    if (!conversation) {
      throw new NotFoundException(
        "DISPUTE_CHAT_NOT_FOUND",
      );
    }

    const adminMessageBody =
      `[ADMIN] ${body}`;

    /*
     * ChatMessage.senderId references a User, not an Admin.
     * Preserve the existing system representation for now:
     * the admin liaison message is written using the job
     * client's user identity while retaining the [ADMIN] marker.
     *
     * This is intentionally left unchanged in this dispute
     * refactor because changing chat authorship is a separate
     * data-model concern.
     */
    const message =
      await this.prisma.chatMessage.create({
        data: {
          conversationId:
            conversation.id,
          senderId:
            dispute.job.clientId,
          body: adminMessageBody,
        },
      });

    const recipients = [
      dispute.job.clientId,
      dispute.job.fixerId,
    ].filter(Boolean) as string[];

    await Promise.all(
      recipients.map((uid) =>
        this.notifications.create({
          userId: uid,
          type: NotificationType.DISPUTE_OPENED,
          title:
            "Admin message in dispute chat",
          body:
            "Admin sent a message regarding your dispute.",
          idempotencyKey:
            `notify:admin_dispute_chat:${message.id}:${uid}`,
          data: {
            disputeId: dispute.id,
            jobId: dispute.job.id,
            conversationId:
              conversation.id,
            messageId: message.id,
          },
        }),
      ),
    );

    return {
      ok: true,
      conversationId: conversation.id,
      message: {
        id: message.id,
        senderId: message.senderId,
        body: message.body,
        createdAt: message.createdAt,
      },
    };
  }
}