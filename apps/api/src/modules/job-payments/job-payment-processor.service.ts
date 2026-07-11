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

@Injectable()
export class JobPaymentProcessorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
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
    await this.prisma.jobPayment.update({
      where: {
        id: jobPaymentId,
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

    await tx.conversation.update({
  where: {
    id: conversationId,
  },
  data: {
    status: "OPEN",
  },
});
  });

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

  if (!payment.job.selectedConversationId) {
    throw new NotFoundException(
      "SELECTED_CONVERSATION_NOT_FOUND",
    );
  }

  const conversation =
    await this.prisma.conversation.findUnique({
      where: {
        id: payment.job.selectedConversationId,
      },
      include: {
        negotiation: true,
      },
    });

  if (!conversation) {
    throw new NotFoundException("CONVERSATION_NOT_FOUND");
  }

  if (
    !conversation.negotiation ||
    conversation.negotiation.lockedPriceMilliFec == null
  ) {
    throw new NotFoundException(
      "NEGOTIATION_NOT_LOCKED",
    );
  }

  const agreedPrice =
    conversation.negotiation.lockedPriceMilliFec;

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
        status: JobStatus.IN_PROGRESS,
        fixerId: conversation.fixerId,
        lockedPriceMilliFec: agreedPrice,
      },
    });

    await tx.conversation.updateMany({
      where: {
        jobId: payment.jobId,
        id: {
          not: conversation.id,
        },
      },
      data: {
        status: "CLOSED",
      },
    });
  });

  try {
    await this.notifications.create({
      userId: payment.job.clientId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: "Payment successful",
      body:
        "Your payment has been confirmed. Your job is now in progress.",
      idempotencyKey: `notif:final-payment-client:${payment.jobId}`,
      data: {
        jobId: payment.jobId,
      },
    });

    await this.notifications.create({
      userId: conversation.fixerId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: "You've been hired",
      body:
        "The client has completed payment. You can now begin work.",
      idempotencyKey: `notif:final-payment-fixer:${payment.jobId}`,
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