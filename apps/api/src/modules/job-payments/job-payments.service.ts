//path: apps/api/src/modules/job-payments/job-payments.service.ts
import { Inject, Injectable } from "@nestjs/common";
import { PrismaService, } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PAYMENT_PROVIDER } from "../payments/payments.constants";
import * as crypto from "crypto";
import { Prisma } from "@prisma/client";
import { JobPaymentProcessorService } from "./job-payment-processor.service";


@Injectable()
export class JobPaymentsService {
  constructor(
  @Inject(PAYMENT_PROVIDER)
  private readonly paymentProvider: any,

  private readonly prisma: PrismaService,
  private readonly notifications: NotificationsService,
  private readonly processor: JobPaymentProcessorService,
) {}

  async createPostingPayment(args: {
  jobId: string;
  clientId: string;
}) {
  const user = await this.prisma.user.findUnique({
    where: {
      id: args.clientId,
    },
    select: {
      email: true,
    },
  });

  if (!user) {
    throw new Error("CLIENT_NOT_FOUND");
  }

  const paystackReference = crypto.randomUUID();

  await this.prisma.jobPayment.upsert({
    where: {
      jobId_type: {
        jobId: args.jobId,
        type: "POSTING",
      },
    },
    update: {
      paystackReference,
      amountMilliFec: 1000,
      paystackFeeMilliFec: 0,
      status: "PENDING",
      fixerId: null,
      conversationId: null,
      lockedPriceMilliFec: null,
      paidAt: null,
    },
    create: {
      jobId: args.jobId,
      type: "POSTING",
      paystackReference,
      amountMilliFec: 1000,
      paystackFeeMilliFec: 0,
      status: "PENDING",
    },
  });

  return this.initializeGatewayPayment({
    email: user.email,
    amountMilliFec: 1000,
    reference: paystackReference,
    metadata: {
    paymentType: "POSTING",
    jobId: args.jobId,
    redirectUrl: `${process.env.FRONTEND_URL}/app/payment/return?jobId=${args.jobId}&type=POSTING`  },
  });
}

async createUrgentHirePayment(
  args: {
    jobId: string;
    clientId: string;
    fixerId: string;
  },
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? this.prisma;

  const user = await db.user.findUnique({
    where: {
      id: args.clientId,
    },
    select: {
      email: true,
    },
  });

  if (!user) {
    throw new Error("CLIENT_NOT_FOUND");
  }

  const job = await db.job.findUnique({
    where: {
      id: args.jobId,
    },
    select: {
      clientId: true,
    },
  });

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (job.clientId !== args.clientId) {
    throw new Error("NOT_JOB_OWNER");
  }

  const paystackReference = crypto.randomUUID();

const conversation = await db.conversation.upsert({
  where: {
    jobId_fixerId: {
      jobId: args.jobId,
      fixerId: args.fixerId,
    },
  },
  update: {},
  create: {
    jobId: args.jobId,
    fixerId: args.fixerId,
    active: false,
  },
  select: {
    id: true,
  },
});

await db.jobPayment.upsert({
  where: {
    jobId_type: {
      jobId: args.jobId,
      type: "URGENT",
    },
  },
  update: {
    paystackReference,
    amountMilliFec: 2000,
    paystackFeeMilliFec: 0,
    fixerId: args.fixerId,
    conversationId: conversation.id,
    lockedPriceMilliFec: null,
    status: "PENDING",
    paidAt: null,
  },
  create: {
    jobId: args.jobId,
    type: "URGENT",
    paystackReference,
    amountMilliFec: 2000,
    paystackFeeMilliFec: 0,
    fixerId: args.fixerId,
    conversationId: conversation.id,
    status: "PENDING",
  },
});

  return this.initializeGatewayPayment({
    email: user.email,
    amountMilliFec: 2000,
    reference: paystackReference,
    metadata: {
      paymentType: "URGENT",
      jobId: args.jobId,
      fixerId: args.fixerId,
      redirectUrl: `${process.env.FRONTEND_URL}/app/payment/return?jobId=${args.jobId}&type=URGENT`,

    },
  });
}
async continuePayment(args: {
  jobId: string;
  clientId: string;
}) {
  const job = await this.prisma.job.findUnique({
    where: {
      id: args.jobId,
    },
    select: {
      id: true,
      clientId: true,
      status: true,
    },
  });

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (job.clientId !== args.clientId) {
    throw new Error("NOT_JOB_OWNER");
  }

  if (job.status !== "DRAFT") {
    throw new Error("ONLY_DRAFT_JOBS_CAN_CONTINUE_PAYMENT");
  }

 const payment = await this.prisma.jobPayment.findFirst({
  where: {
    jobId: args.jobId,
    type: "POSTING",
    status: "PENDING",
  },
});

  if (!payment) {
    throw new Error("NO_PENDING_PAYMENT_FOUND");
  }

  const user = await this.prisma.user.findUnique({
    where: {
      id: args.clientId,
    },
    select: {
      email: true,
    },
  });
  const newReference = crypto.randomUUID();

await this.prisma.jobPayment.update({
  where: {
    id: payment.id,
  },
  data: {
    paystackReference: newReference,
    status: "PENDING",
    paidAt: null,
  },
});

  if (!user) {
    throw new Error("CLIENT_NOT_FOUND");
  }

  return this.initializeGatewayPayment({
    email: user.email,
    amountMilliFec: payment.amountMilliFec,
    reference: newReference,
    metadata: {
      paymentType: payment.type,
      jobId: job.id,
      conversationId: payment.conversationId ?? undefined,
      fixerId: payment.fixerId ?? undefined,
      redirectUrl: `${process.env.FRONTEND_URL}/app/payment/return?jobId=${job.id}&type=${payment.type}`,
    },
  });
}

  async createFinalPayment(
  args: {
    jobId: string;
    clientId: string;
    conversationId: string;
  },
  tx?: Prisma.TransactionClient,
) 

{
  const db = tx ?? this.prisma;
  const user = await db.user.findUnique({
    where: {
      id: args.clientId,
    },
    select: {
      email: true,
    },
  });

  if (!user) {
    throw new Error("CLIENT_NOT_FOUND");
  }

  const job = await db.job.findUnique({
    where: {
      id: args.jobId,
    },
    select: {
      clientId: true,
      status: true,
    },
  });

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (job.clientId !== args.clientId) {
    throw new Error("NOT_JOB_OWNER");
  }

  const negotiation = await db.negotiation.findUnique({
    where: {
      conversationId: args.conversationId,
    },
    select: {
      status: true,
      lockedPriceMilliFec: true,
      conversation: {
        select: {
          fixerId: true,
        },
      },
    },
  });

  if (!negotiation) {
    throw new Error("NEGOTIATION_NOT_FOUND");
  }

  if (negotiation.status !== "AGREED") {
    throw new Error("PRICE_NOT_AGREED");
  }

  if (!negotiation.lockedPriceMilliFec) {
    throw new Error("LOCKED_PRICE_MISSING");
  }

  const paystackReference = crypto.randomUUID();

  await db.jobPayment.upsert({
    where: {
      jobId_type: {
        jobId: args.jobId,
        type: "FINAL",
      },
    },
    update: {
      paystackReference,
      fixerId: negotiation.conversation.fixerId,
      conversationId: args.conversationId,
      lockedPriceMilliFec:
        negotiation.lockedPriceMilliFec,
      amountMilliFec:
        negotiation.lockedPriceMilliFec,
      paystackFeeMilliFec: 0,
      status: "PENDING",
    },
    create: {
      jobId: args.jobId,
      type: "FINAL",
      paystackReference,
      fixerId: negotiation.conversation.fixerId,
      conversationId: args.conversationId,
      lockedPriceMilliFec:
        negotiation.lockedPriceMilliFec,
      amountMilliFec:
        negotiation.lockedPriceMilliFec,
      paystackFeeMilliFec: 0,
      status: "PENDING",
    },
  });

  return this.initializeGatewayPayment({
    email: user.email,
    amountMilliFec:
      negotiation.lockedPriceMilliFec,
    reference: paystackReference,
    metadata: {
      paymentType: "FINAL",
      jobId: args.jobId,
      conversationId: args.conversationId,
      redirectUrl: `${process.env.FRONTEND_URL}/app/payment/return?jobId=${args.jobId}&type=FINAL`,
    },
  });
}

  async handleSuccessfulPayment(jobPaymentId: string) {
  return this.processor.handleSuccessfulPayment(jobPaymentId);
}

async handleFailedPayment(jobPaymentId: string) {
  return this.processor.handleFailedPayment(jobPaymentId);
}

  async getJobPayments(jobId: string) {
  const payments = await this.prisma.jobPayment.findMany({
    where: {
      jobId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      type: true,
      status: true,
      amountMilliFec: true,
      paystackReference: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    posting:
      payments.find((p) => p.type === "POSTING") ?? null,

    urgent:
      payments.find((p) => p.type === "URGENT") ?? null,

    final:
      payments.find((p) => p.type === "FINAL") ?? null,
  };
}

  async initializeGatewayPayment(args: {
    email: string;
    amountMilliFec: number;
    reference: string;
    metadata?: Record<string, unknown>;
  }) {
    const amountKobo = args.amountMilliFec * 100;

    return this.paymentProvider.initializeTransaction({
      email: args.email,
      amountKobo,
      reference: args.reference,
      metadata: args.metadata ?? {},
    });
  }
  async getPaymentStatus(jobId: string) {
  const payment = await this.prisma.jobPayment.findFirst({
    where: {
      jobId,
      type: {
        in: ["POSTING", "URGENT", "FINAL"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      status: true,
      type: true,
      jobId: true,
    },
  });

  return {
    paid: payment?.status === "SUCCESS",
    status: payment?.status ?? null,
    type: payment?.type ?? null,
    jobId,
  };
}
}