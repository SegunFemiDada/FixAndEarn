//path: apps/api/src/modules/earnings/withdrawal-allocation.repo.ts
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class WithdrawalAllocationRepo {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private db(tx?: DbClient) {
    return tx ?? this.prisma;
  }

  create(
    args: {
      withdrawalId: string;
      earningId: string;
      amountMilliFec: number;
    },
    tx?: DbClient,
  ) {
    return this.db(tx).withdrawalAllocation.create({
      data: {
        withdrawalId: args.withdrawalId,
        earningId: args.earningId,
        amountMilliFec: args.amountMilliFec,
      },
    });
  }

  findByWithdrawal(
    withdrawalId: string,
    tx?: DbClient,
  ) {
    return this.db(tx).withdrawalAllocation.findMany({
      where: {
        withdrawalId,
      },
      include: {
        earning: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  findByEarning(
    earningId: string,
    tx?: DbClient,
  ) {
    return this.db(tx).withdrawalAllocation.findMany({
      where: {
        earningId,
      },
    });
  }

  delete(
    id: string,
    tx?: DbClient,
  ) {
    return this.db(tx).withdrawalAllocation.delete({
      where: {
        id,
      },
    });
  }

  deleteByWithdrawal(
    withdrawalId: string,
    tx?: DbClient,
  ) {
    return this.db(tx).withdrawalAllocation.deleteMany({
      where: {
        withdrawalId,
      },
    });
  }
}