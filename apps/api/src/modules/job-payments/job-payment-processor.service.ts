//path: apps/api/src/modules/job-payments/job-payment-processor.service.ts

import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  JobPaymentStatus,
  JobStatus,
  NotificationType,
} from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ChatRealtimeService } from "src/chat/realtime/chat-realtime.service";

@Injectable()
export class JobPaymentProcessorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: ChatRealtimeService,
  ) {}

  async handleSuccessfulPayment(jobPaymentId: string) {
    const payment = await this.prisma.jobPayment.findUnique({
      where: {
        id: jobPaymentId,
      },
      include: {
        job: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("JOB_PAYMENT_NOT_FOUND");
    }

    if (payment.status === JobPaymentStatus.SUCCESS) {
      return {
        ok: true,
        alreadyProcessed: true,
      };
    }

    /*
     * FINAL payments have an expiration window.
     *
     * A successful gateway callback that arrives after the
     * expiration must NOT start the job.
     *
     * The expiration service normally marks the payment as
     * EXPIRED, but this check is intentionally performed here
     * as a final protection against a late webhook.
     */
    if (
      payment.type === "FINAL" &&
      payment.status === JobPaymentStatus.PENDING &&
      payment.expiresAt &&
      payment.expiresAt.getTime() <= Date.now()
    ) {
      const expired = await this.prisma.jobPayment.updateMany({
        where: {
          id: payment.id,
          status: JobPaymentStatus.PENDING,
        },
        data: {
          status: JobPaymentStatus.EXPIRED,
        },
      });

      if (expired.count > 0) {
        return {
          ok: true,
          paymentType: payment.type,
          expired: true,
        };
      }

      /*
       * Another process may have expired or successfully
       * processed the payment between the initial read and
       * this update.
       */
      const currentPayment = await this.prisma.jobPayment.findUnique({
        where: {
          id: payment.id,
        },
        select: {
          status: true,
        },
      });

      if (currentPayment?.status === JobPaymentStatus.SUCCESS) {
        return {
          ok: true,
          alreadyProcessed: true,
        };
      }

      if (currentPayment?.status === JobPaymentStatus.EXPIRED) {
        return {
          ok: true,
          paymentType: payment.type,
          expired: true,
        };
      }

      return {
        ok: true,
      };
    }

    /*
     * If the expiration worker already marked the payment as
     * EXPIRED before this webhook arrived, the payment must
     * never be processed.
     */
    if (payment.status === JobPaymentStatus.EXPIRED) {
      return {
        ok: true,
        paymentType: payment.type,
        expired: true,
      };
    }

    switch (payment.type) {
      case "POSTING":
        return this.completePostingPayment(payment.id);

      case "URGENT":
        return this.completeUrgentHirePayment(payment.id);

      case "FINAL":
        return this.completeFinalPayment(payment.id);

      default:
        return {
          ok: true,
        };
    }
  }

  async handleFailedPayment(jobPaymentId: string) {
    const payment = await this.prisma.jobPayment.findUnique({
      where: {
        id: jobPaymentId,
      },
      select: {
        id: true,
        status: true,
        type: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("JOB_PAYMENT_NOT_FOUND");
    }

    /*
     * Never overwrite a terminal payment state.
     *
     * In particular, a late FAILED callback must not overwrite
     * an already successful or expired payment.
     */
    if (
      payment.status === JobPaymentStatus.SUCCESS ||
      payment.status === JobPaymentStatus.EXPIRED
    ) {
      return {
        ok: true,
        alreadyProcessed: true,
        status: payment.status,
      };
    }

    await this.prisma.jobPayment.updateMany({
      where: {
        id: jobPaymentId,
        status: JobPaymentStatus.PENDING,
      },
      data: {
        status: JobPaymentStatus.FAILED,
      },
    });

    return {
      ok: true,
    };
  }

  private async completePostingPayment(jobPaymentId: string) {
    const payment = await this.prisma.jobPayment.findUnique({
      where: {
        id: jobPaymentId,
      },
      include: {
        job: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("JOB_PAYMENT_NOT_FOUND");
    }

    if (payment.status === JobPaymentStatus.SUCCESS) {
      return {
        ok: true,
        alreadyProcessed: true,
      };
    }

    if (payment.status === JobPaymentStatus.EXPIRED) {
      return {
        ok: true,
        paymentType: payment.type,
        expired: true,
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.jobPayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: JobPaymentStatus.SUCCESS,
          paidAt: new Date(),
        },
      });

      await tx.job.update({
        where: {
          id: payment.jobId,
        },
        data: {
          status: JobStatus.OPEN,
        },
      });
    });

    try {
      await this.notifications.create({
        userId: payment.job.clientId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Job published",
        body: "Your job is now live and visible to verified fixers.",
        idempotencyKey: `notif:job_posted:${payment.jobId}`,
        data: {
          jobId: payment.jobId,
        },
      });
    } catch {}

    return {
      ok: true,
      paymentType: payment.type,
    };
  }

  private async completeUrgentHirePayment(
    jobPaymentId: string,
  ) {
    const payment = await this.prisma.jobPayment.findUnique({
      where: {
        id: jobPaymentId,
      },
      include: {
        job: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("JOB_PAYMENT_NOT_FOUND");
    }

    if (payment.status === JobPaymentStatus.SUCCESS) {
      return {
        ok: true,
        alreadyProcessed: true,
      };
    }

    if (payment.status === JobPaymentStatus.EXPIRED) {
      return {
        ok: true,
        paymentType: payment.type,
        expired: true,
      };
    }

    if (!payment.conversationId) {
      throw new NotFoundException("CONVERSATION_NOT_FOUND");
    }

    const conversationId = payment.conversationId;

    await this.prisma.$transaction(async (tx) => {
      await tx.jobPayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: JobPaymentStatus.SUCCESS,
          paidAt: new Date(),
        },
      });

      await tx.job.update({
        where: {
          id: payment.jobId,
        },
        data: {
          status: JobStatus.OPEN,
          fixerId: payment.fixerId,
        },
      });

      await tx.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          status: "OPEN",
        },
      });
    });

    if (payment.fixerId) {
      const room = this.realtime.roomFor(
        payment.jobId,
        payment.fixerId,
      );

      this.realtime.emitToRoom(
        room,
        "job:started",
        {
          jobId: payment.jobId,
          fixerId: payment.fixerId,
          status: "OPEN",
          urgentHire: true,
        },
      );

      this.realtime.emitToRoom(
        room,
        "job:update",
        {
          jobId: payment.jobId,
        },
      );
    }

    try {
      await this.notifications.create({
        userId: payment.job.clientId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Urgent hire activated",
        body: "Your payment was successful. You can now chat with the fixer.",
        idempotencyKey: `notif:urgent_paid:client:${payment.id}`,
        data: {
          jobId: payment.jobId,
          conversationId: payment.conversationId,
        },
      });
    } catch {}

    if (payment.fixerId) {
      try {
        await this.notifications.create({
          userId: payment.fixerId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: "New urgent hire",
          body: "A client has started an urgent hire conversation with you.",
          idempotencyKey: `notif:urgent_paid:fixer:${payment.id}`,
          data: {
            jobId: payment.jobId,
            conversationId: payment.conversationId,
          },
        });
      } catch {}
    }

    return {
      ok: true,
      paymentType: payment.type,
    };
  }

  private async completeFinalPayment(
    jobPaymentId: string,
  ) {
    const payment = await this.prisma.jobPayment.findUnique({
      where: {
        id: jobPaymentId,
      },
      include: {
        job: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("JOB_PAYMENT_NOT_FOUND");
    }

    if (payment.status === JobPaymentStatus.SUCCESS) {
      return {
        ok: true,
        alreadyProcessed: true,
      };
    }

    /*
     * This is the final protection against a late successful
     * payment callback.
     *
     * Even if the expiration worker has not run yet, an expired
     * FINAL payment must not move the job to IN_PROGRESS.
     */
    if (
      payment.status === JobPaymentStatus.PENDING &&
      payment.expiresAt &&
      payment.expiresAt.getTime() <= Date.now()
    ) {
      const expired = await this.prisma.jobPayment.updateMany({
        where: {
          id: payment.id,
          status: JobPaymentStatus.PENDING,
        },
        data: {
          status: JobPaymentStatus.EXPIRED,
        },
      });

      if (expired.count > 0) {
        return {
          ok: true,
          paymentType: payment.type,
          expired: true,
        };
      }

      const currentPayment = await this.prisma.jobPayment.findUnique({
        where: {
          id: payment.id,
        },
        select: {
          status: true,
        },
      });

      if (currentPayment?.status === JobPaymentStatus.SUCCESS) {
        return {
          ok: true,
          alreadyProcessed: true,
        };
      }

      if (currentPayment?.status === JobPaymentStatus.EXPIRED) {
        return {
          ok: true,
          paymentType: payment.type,
          expired: true,
        };
      }

      return {
        ok: true,
      };
    }

    if (payment.status === JobPaymentStatus.EXPIRED) {
      return {
        ok: true,
        paymentType: payment.type,
        expired: true,
      };
    }

    if (!payment.fixerId) {
      throw new NotFoundException("FIXER_NOT_FOUND");
    }

    if (!payment.lockedPriceMilliFec) {
      throw new NotFoundException("LOCKED_PRICE_NOT_FOUND");
    }

    if (!payment.conversationId) {
      throw new NotFoundException("CONVERSATION_NOT_FOUND");
    }

    const conversationId = payment.conversationId;
    const fixerId = payment.fixerId;
    const lockedPrice = payment.lockedPriceMilliFec;

    /*
     * The transaction makes the payment success + job activation
     * atomic.
     *
     * The payment is only allowed to transition from PENDING to
     * SUCCESS. This prevents an already-expired payment from being
     * activated by a concurrent process.
     */
    const result = await this.prisma.$transaction(async (tx) => {
      const paymentUpdate = await tx.jobPayment.updateMany({
        where: {
          id: payment.id,
          status: JobPaymentStatus.PENDING,
          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: new Date(),
              },
            },
          ],
        },
        data: {
          status: JobPaymentStatus.SUCCESS,
          paidAt: new Date(),
        },
      });

      if (paymentUpdate.count === 0) {
        return {
          processed: false,
        };
      }

      await tx.job.update({
        where: {
          id: payment.jobId,
        },
        data: {
          fixerId,
          lockedPriceMilliFec: lockedPrice,
          status: JobStatus.IN_PROGRESS,
        },
      });

      await tx.conversation.updateMany({
        where: {
          jobId: payment.jobId,
          NOT: {
            id: conversationId,
          },
        },
        data: {
          status: "CLOSED",
        },
      });

      return {
        processed: true,
      };
    });

    /*
     * If another process won the race, determine the final state
     * before returning.
     */
    if (!result.processed) {
      const currentPayment = await this.prisma.jobPayment.findUnique({
        where: {
          id: payment.id,
        },
        select: {
          status: true,
        },
      });

      if (currentPayment?.status === JobPaymentStatus.SUCCESS) {
        return {
          ok: true,
          alreadyProcessed: true,
        };
      }

      if (currentPayment?.status === JobPaymentStatus.EXPIRED) {
        return {
          ok: true,
          paymentType: payment.type,
          expired: true,
        };
      }

      return {
        ok: true,
      };
    }

    const room = this.realtime.roomFor(
      payment.jobId,
      fixerId,
    );

    this.realtime.emitToRoom(
      room,
      "job:started",
      {
        jobId: payment.jobId,
        fixerId,
        status: "IN_PROGRESS",
      },
    );

    try {
      await this.notifications.create({
        userId: payment.job.clientId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Payment confirmed",
        body: "Your payment has been confirmed successfully. The job is now in progress, and the fixer can begin work.",
        idempotencyKey: `notif:job_started_client:${payment.jobId}`,
        data: {
          jobId: payment.jobId,
        },
      });
    } catch {}

    try {
      await this.notifications.create({
        userId: fixerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "You've been hired.",
        body: "The client's payment has been confirmed. You may now begin work. Your earnings will become available immediately after the client approves the completion request.",
        idempotencyKey: `notif:job_started_fixer:${payment.jobId}`,
        data: {
          jobId: payment.jobId,
        },
      });
    } catch {}

    return {
      ok: true,
      paymentType: payment.type,
    };
  }
}