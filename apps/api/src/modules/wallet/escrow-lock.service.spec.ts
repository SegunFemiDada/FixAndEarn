import { EscrowLockService } from "./escrow-lock.service";
import { JobStatus } from "@prisma/client";

describe("EscrowLockService", () => {
  it("sums locked escrow amount for IN_PROGRESS jobs using lockedPriceMilliFec when present", async () => {
    const prismaMock: any = {
      job: {
        findMany: jest.fn().mockResolvedValue([
          { lockedPriceMilliFec: 5000, priceMilliFec: 6000 },
          { lockedPriceMilliFec: null, priceMilliFec: 2000 }
        ])
      }
    };

    const svc = new EscrowLockService(prismaMock);

    const total = await svc.getLockedEscrowAmountForFixer("fixer_1");

    expect(prismaMock.job.findMany).toHaveBeenCalledWith({
      where: { fixerId: "fixer_1", status: JobStatus.IN_PROGRESS },
      select: { lockedPriceMilliFec: true, priceMilliFec: true }
    });

    expect(total).toBe(7000);
  });

  it("returns 0 when no jobs are in progress", async () => {
    const prismaMock: any = {
      job: {
        findMany: jest.fn().mockResolvedValue([])
      }
    };

    const svc = new EscrowLockService(prismaMock);

    const total = await svc.getLockedEscrowAmountForFixer("fixer_1");
    expect(total).toBe(0);
  });
});