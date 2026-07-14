//path: apps/api/src/modules/job-payments/job-payments.service.ts
import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PAYSTACK_PROVIDER } from "../payments/payments.constants";
import { PaystackProvider } from "../payments/paystack/paystack.provider";
import * as crypto from "crypto";


@Injectable()
export class JobPaymentsService {
  constructor(
    @Inject(PAYSTACK_PROVIDER)
    private readonly paystack: PaystackProvider,

    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
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

  return this.initializePaystackPayment({
    email: user.email,
    amountMilliFec: 1000,
    reference: paystackReference,
    metadata: {
      paymentType: "POSTING",
      jobId: args.jobId,
    },
  });
}

async createUrgentHirePayment(args: {
  jobId: string;
  clientId: string;
  fixerId: string;
  conversationId: string;
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

  const job = await this.prisma.job.findUnique({
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

  await this.prisma.jobPayment.upsert({
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
      conversationId: args.conversationId,
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
      conversationId: args.conversationId,
      status: "PENDING",
    },
  });

  return this.initializePaystackPayment({
    email: user.email,
    amountMilliFec: 2000,
    reference: paystackReference,
    metadata: {
      paymentType: "URGENT",
      jobId: args.jobId,
      conversationId: args.conversationId,
    },
  });
}

  async createFinalPayment(args: {
  jobId: string;
  clientId: string;
  conversationId: string;
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

  const job = await this.prisma.job.findUnique({
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

  const negotiation = await this.prisma.negotiation.findUnique({
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

  await this.prisma.jobPayment.upsert({
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

  return this.initializePaystackPayment({
    email: user.email,
    amountMilliFec:
      negotiation.lockedPriceMilliFec,
    reference: paystackReference,
    metadata: {
      paymentType: "FINAL",
      jobId: args.jobId,
      conversationId: args.conversationId,
    },
  });
}

  async handleSuccessfulPayment() {
    throw new Error("Not implemented.");
  }

  async handleFailedPayment() {
    throw new Error("Not implemented.");
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

  async initializePaystackPayment(args: {
    email: string;
    amountMilliFec: number;
    reference: string;
    metadata?: Record<string, unknown>;
  }) {
    const amountKobo = Math.round((args.amountMilliFec / 1000) * 100);

    return this.paystack.initializeTransaction({
      email: args.email,
      amountKobo,
      reference: args.reference,
      metadata: args.metadata ?? {},
    });
  }
}