import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  JobPaymentStatus,
  JobPaymentType,
} from "@prisma/client";
import { AdminPaymentsRepo } from "./admin-payments.repo";

@Injectable()
export class AdminPaymentsService {
  constructor(private readonly repo: AdminPaymentsRepo) {}

  async list(args: {
    q?: string;
    status?: JobPaymentStatus;
    type?: JobPaymentType;
    jobId?: string;
    clientId?: string;
    fixerId?: string;
    skip?: number;
    take?: number;
  }) {
    const skip = Math.max(0, args.skip ?? 0);
    const take = Math.min(
      Math.max(1, args.take ?? 20),
      100,
    );

    return this.repo.listPayments({
      q: args.q,
      status: args.status,
      type: args.type,
      jobId: args.jobId,
      clientId: args.clientId,
      fixerId: args.fixerId,
      skip,
      take,
    });
  }

  async getOne(id: string) {
    const payment = await this.repo.getPayment(id);

    if (!payment) {
      throw new NotFoundException(
        "PAYMENT_NOT_FOUND",
      );
    }

    return payment;
  }
}