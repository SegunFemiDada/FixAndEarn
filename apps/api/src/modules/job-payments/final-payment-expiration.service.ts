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
          },
        },
      },
    });

    for (const payment of payments) {
      const expired = await this.prisma.jobPayment.updateMany({
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

      if (expired.count !== 1) {
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
    };
  }) {
    try {
      await this.notifications.create({
        userId: payment.job.clientId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Final payment expired",
        body:
          "The final payment window has expired. The job has not started. You can initiate the final payment again from the agreed job.",
        idempotencyKey:
          `notif:final_payment_expired:client:${payment.id}`,
        data: {
          jobId: payment.jobId,
          paymentId: payment.id,
          paymentType: "FINAL",
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
          "The client's final payment window has expired. The job has not started.",
        idempotencyKey:
          `notif:final_payment_expired:fixer:${payment.id}`,
        data: {
          jobId: payment.jobId,
          paymentId: payment.id,
          paymentType: "FINAL",
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