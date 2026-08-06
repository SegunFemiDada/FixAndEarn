//path: apps/api/src/modules/earnings/earnings.repo.ts
import { Injectable } from "@nestjs/common";
import {
  FixerEarningStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class EarningsRepo {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: DbClient) {
    return tx ?? this.prisma;
  }

  async createFixerEarning(
    args: {
      fixerId: string;
      jobId: string;
      availableMilliFec: number;
    },
    tx?: DbClient,
  ) {
    return this.db(tx).fixerEarning.create({
      data: {
  fixerId: args.fixerId,
  jobId: args.jobId,

  amountMilliFec: args.availableMilliFec,

  availableMilliFec: args.availableMilliFec,

  status: "AVAILABLE",
}
    });
  }

  async createPlatformRevenue(
    args: {
      jobId: string;
      grossMilliFec: number;
      platformFeeMilliFec: number;
    },
    tx?: DbClient,
  ) {
    return this.db(tx).platformRevenue.create({
      data: {
        jobId: args.jobId,
        grossMilliFec: args.grossMilliFec,
        platformFeeMilliFec: args.platformFeeMilliFec,
      },
    });
  }

  async findByJobId(jobId: string, tx?: DbClient) {
    return this.db(tx).fixerEarning.findUnique({
      where: {
        jobId,
      },
    });
  }

  async getById(id: string, tx?: DbClient) {
    return this.db(tx).fixerEarning.findUnique({
      where: {
        id,
      },
    });
  }

  async getAvailableBalance(
    fixerId: string,
    tx?: DbClient,
  ): Promise<number> {
    const result = await this.db(tx).fixerEarning.aggregate({
      where: {
        fixerId,
        status: {
          in: [
            FixerEarningStatus.AVAILABLE,
            FixerEarningStatus.PARTIALLY_WITHDRAWN,
          ],
        },
      },
      _sum: {
        availableMilliFec: true,
      },
    });

    return result._sum.availableMilliFec ?? 0;
  }

  async getAvailableEarnings(
    fixerId: string,
    tx?: DbClient,
  ) {
    return this.db(tx).fixerEarning.findMany({
      where: {
        fixerId,
        status: {
          in: [
            FixerEarningStatus.AVAILABLE,
            FixerEarningStatus.PARTIALLY_WITHDRAWN,
          ],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async getHistory(
    fixerId: string,
    tx?: DbClient,
  ) {
    return this.db(tx).fixerEarning.findMany({
      where: {
        fixerId,
      },
      include: {
        job: {
          select: {
            id: true,
            skillCategory: true,
            state: true,
            city: true,
            completedApprovedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getSummary(
  fixerId: string,
  tx?: DbClient,
) {
  const available =
    await this.getAvailableBalance(
      fixerId,
      tx,
    );

  const paidAmount =
    await this.db(tx).withdrawalAllocation.aggregate({
      _sum: {
        amountMilliFec: true,
      },
      where: {
        earning: {
          fixerId,
          status: FixerEarningStatus.PAID,
        },
      },
    });

  const paidJobs =
    await this.db(tx).fixerEarning.count({
      where: {
        fixerId,
        status: FixerEarningStatus.PAID,
      },
    });

  return {
    availableMilliFec: available,
    paidMilliFec: paidAmount._sum.amountMilliFec ?? 0,
    paidJobs,
  };
}

async getAvailableBalanceTx(
  tx: Prisma.TransactionClient,
  fixerId: string,
) {
  return this.getAvailableBalance(
    fixerId,
    tx,
  );
}


async setStatus(
  earningId: string,
  status: FixerEarningStatus,
  tx?: DbClient,
) {
  return this.update(
    earningId,
    {
      status,
    },
    tx,
  );
}

async reserveAmount(
  earningId: string,
  amount: number,
  tx?: DbClient,
) {
  return this.db(tx).fixerEarning.update({
    where: {
      id: earningId,
    },
    data: {
  availableMilliFec: {
    decrement: amount,
  },
},
  });
}

  async update(
    id: string,
    data: Prisma.FixerEarningUpdateInput,
    tx?: DbClient,
  ) {
    return this.db(tx).fixerEarning.update({
      where: {
        id,
      },
      data,
    });
  }
}