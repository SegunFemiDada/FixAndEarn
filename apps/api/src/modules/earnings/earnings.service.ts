// path: apps/api/src/modules/earnings/earnings.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, FixerEarningStatus } from "@prisma/client";
import { EarningsRepo } from "./earnings.repo";
import { WithdrawalAllocationRepo } from "./withdrawal-allocation.repo";

@Injectable()
export class EarningsService {
  constructor(
  private readonly repo: EarningsRepo,
  private readonly allocationRepo: WithdrawalAllocationRepo,
) {}

  async getAvailableBalance(fixerId: string) {
    const available = await this.repo.getAvailableBalance(
      fixerId,
    );

    return {
      availableMilliFec: available,
      availableNaira: available / 1000,
    };
  }

  async getSummary(fixerId: string) {
  const summary = await this.repo.getSummary(
    fixerId,
  );

  return {
    availableMilliFec:
      summary.availableMilliFec,
    availableNaira:
      summary.availableMilliFec / 1000,

    paidMilliFec:
      summary.paidMilliFec,
    paidNaira:
      summary.paidMilliFec / 1000,
  };
}

  async getHistory(fixerId: string) {
    return this.repo.getHistory(fixerId);
  }

  async getEarningByJob(jobId: string) {
    const earning =
      await this.repo.findByJobId(jobId);

    if (!earning) {
      throw new NotFoundException(
        "EARNING_NOT_FOUND",
      );
    }

    return earning;
  }

  async reserveForWithdrawal(
    tx: Prisma.TransactionClient,
    fixerId: string,
    withdrawalId: string,
    amountMilliFec: number,
  ) {
    if (amountMilliFec <= 0) {
      throw new BadRequestException(
        "INVALID_AMOUNT",
      );
    }

    const available =
      await this.repo.getAvailableBalance(
        fixerId,
        tx,
      );

    if (available < amountMilliFec) {
      throw new BadRequestException(
        "INSUFFICIENT_AVAILABLE_EARNINGS",
      );
    }

    let remaining = amountMilliFec;

    const earnings =
      await this.repo.getAvailableEarnings(
        fixerId,
        tx,
      );

    for (const earning of earnings) {
      if (remaining <= 0) {
        break;
      }

      if (earning.availableMilliFec <= 0) {
        continue;
      }

      const consume = Math.min(
  remaining,
  earning.availableMilliFec,
);

const remainingOnThisJob =
  earning.availableMilliFec - consume;

const nextStatus =
  remainingOnThisJob === 0
    ? FixerEarningStatus.PAID
    : FixerEarningStatus.PARTIALLY_WITHDRAWN;

const reserved = await this.repo.reserveAmount(
  earning.id,
  consume,
  nextStatus,
  tx,
);

if (reserved.count !== 1) {
  continue;
}

await this.allocationRepo.create(
  {
    withdrawalId,
    earningId: earning.id,
    amountMilliFec: consume,
  },
  tx,
);

remaining -= consume;
    }

    if (remaining > 0) {
      throw new BadRequestException(
        "FAILED_TO_RESERVE_EARNINGS",
      );
    }
  }

  async restoreWithdrawal(
  tx: Prisma.TransactionClient,
  withdrawalId: string,
) {
  const allocations =
    await this.allocationRepo.findByWithdrawal(
      withdrawalId,
      tx,
    );

  for (const allocation of allocations) {
  const earning = await this.repo.getById(
    allocation.earningId,
    tx,
  );

  if (!earning) {
    throw new NotFoundException("EARNING_NOT_FOUND");
  }

  const restoredAvailableMilliFec =
    earning.availableMilliFec + allocation.amountMilliFec;

  const nextStatus =
    restoredAvailableMilliFec === earning.amountMilliFec
      ? FixerEarningStatus.AVAILABLE
      : FixerEarningStatus.PARTIALLY_WITHDRAWN;

  await this.repo.update(
    allocation.earningId,
    {
      availableMilliFec: restoredAvailableMilliFec,
      status: nextStatus,
    },
    tx,
  );

  await this.allocationRepo.delete(
    allocation.id,
    tx,
  );
}
}

  async finalizeWithdrawal(
  tx: Prisma.TransactionClient,
  withdrawalId: string,
) {
  const allocations =
    await this.allocationRepo.findByWithdrawal(
      withdrawalId,
      tx,
    );

  for (const allocation of allocations) {
    const earning = allocation.earning;

    await this.repo.update(
      earning.id,
      {
        paidAt: new Date(),
        status:
          earning.availableMilliFec === 0
            ? FixerEarningStatus.PAID
            : FixerEarningStatus.PARTIALLY_WITHDRAWN,
      },
      tx,
    );

    await this.allocationRepo.delete(
      allocation.id,
      tx,
    );
  }
}
}