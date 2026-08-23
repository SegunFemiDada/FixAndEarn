import {
  Injectable,
  Logger,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  JobPaymentStatus,
  NotificationType,
} from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ChatRealtimeService } from "../../chat/realtime/chat-realtime.service";

@Injectable()
export class FinalPaymentExpirationService {
  private readonly logger = new Logger(
    FinalPaymentExpirationService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: ChatRealtimeService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expirePendingFinalPayments() {
    const now = new Date();

    const payments = await this.prisma.jobPayment.findMany({
      where: {
        type: "FINAL",
        status: JobPaymentStatus.PENDING,
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        jobId: true,
        fixerId: true,
        conversationId: true,
        expiresAt: true,
        job: {
          select: {
            clientId: true,
            status: true,
            postingType: true,
          },
        },
      },
    });

    for (const payment of payments) {
      const expired = await this.prisma.$transaction(async (tx) => {
        /*
         * First atomically claim the expiration.
         *
         * If the payment was successfully paid by a webhook between
         * findMany() and this update, updateMany() returns 0 and we
         * must not reset the job.
         */
        const paymentUpdate = await tx.jobPayment.updateMany({
          where: {
            id: payment.id,
            type: "FINAL",
            status: JobPaymentStatus.PENDING,
            expiresAt: {
              lte: now,
            },
          },
          data: {
            status: JobPaymentStatus.EXPIRED,
          },
        });

        if (paymentUpdate.count !== 1) {
          return false;
        }

        /*
         * FINAL payment expiration only applies before the job starts.
         * A successful final-payment webhook changes the job to
         * IN_PROGRESS, so an IN_PROGRESS job must never be reset here.
         */
        if (payment.job.status !== "OPEN") {
          return true;
        }

        /*
         * STANDARD job:
         *
         * OPEN
         * fixer assigned
         * final payment expires
         *        ↓
         * OPEN
         * fixer removed
         * locked price removed
         *
         * This makes the job eligible for the marketplace again.
         *
         * URGENT job:
         *
         * OPEN
         * fixer assigned
         * final payment expires
         *        ↓
         * DRAFT
         * fixer removed
         * locked price removed
         *
         * The urgent job therefore becomes owner-only again.
         */
        if (payment.job.postingType === "URGENT") {
          await tx.job.update({
            where: {
              id: payment.jobId,
            },
            data: {
              status: "DRAFT",
              fixerId: null,
              lockedPriceMilliFec: null,
            },
          });
        } else {
          await tx.job.update({
            where: {
              id: payment.jobId,
            },
            data: {
              status: "OPEN",
              fixerId: null,
              lockedPriceMilliFec: null,
            },
          });
        }

        /*
         * The negotiation/payment conversation is finished once
         * the final payment window expires.
         *
         * Both fields are closed explicitly:
         * - status prevents further chat/negotiation access
         * - active prevents the UI from treating it as live
         */
        if (payment.conversationId) {
          await tx.conversation.updateMany({
            where: {
              id: payment.conversationId,
            },
            data: {
              status: "CLOSED",
              active: false,
            },
          });
        }

        return true;
      });

      if (!expired) {
        continue;
      }

      await this.notifyExpiration(payment);

      this.emitExpiration(payment);
    }
  }

  private async notifyExpiration(payment: {
    id: string;
    jobId: string;
    fixerId: string | null;
    conversationId: string | null;
    expiresAt: Date | null;
    job: {
      clientId: string;
      status: string;
      postingType: string;
    };
  }) {
    try {
      await this.notifications.create({
        userId: payment.job.clientId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Final payment expired",
        body:
          payment.job.postingType === "URGENT"
            ? "The final payment window has expired. The urgent hire has not started. You can review the job from your jobs."
            : "The final payment window has expired. The job has not started and is available again on the marketplace.",
        idempotencyKey:
          `notif:final_payment_expired:client:${payment.id}`,
        data: {
          jobId: payment.jobId,
          paymentId: payment.id,
          paymentType: "FINAL",
          postingType: payment.job.postingType,
          expiresAt: payment.expiresAt,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to notify client about expired final payment ${payment.id}`,
      );
    }

    if (!payment.fixerId) {
      return;
    }

    try {
      await this.notifications.create({
        userId: payment.fixerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Final payment expired",
        body:
          "The client's final payment window has expired. The job has not started and the negotiation has been closed.",
        idempotencyKey:
          `notif:final_payment_expired:fixer:${payment.id}`,
        data: {
          jobId: payment.jobId,
          paymentId: payment.id,
          paymentType: "FINAL",
          postingType: payment.job.postingType,
          expiresAt: payment.expiresAt,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to notify fixer about expired final payment ${payment.id}`,
      );
    }
  }

  private emitExpiration(payment: {
    id: string;
    jobId: string;
    fixerId: string | null;
    conversationId: string | null;
    expiresAt: Date | null;
  }) {
    if (!payment.fixerId) {
      return;
    }

    const room = this.realtime.roomFor(
      payment.jobId,
      payment.fixerId,
    );

    this.realtime.emitToRoom(
      room,
      "payment:expired",
      {
        jobId: payment.jobId,
        paymentId: payment.id,
        paymentType: "FINAL",
        conversationId: payment.conversationId,
        expiresAt: payment.expiresAt,
        status: JobPaymentStatus.EXPIRED,
      },
    );
  }
}