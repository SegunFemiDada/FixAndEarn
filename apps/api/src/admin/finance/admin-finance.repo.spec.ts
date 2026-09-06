import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AdminFinanceRepo } from "./admin-finance.repo";

describe("AdminFinanceRepo withdrawal concurrency and allocation integrity", () => {
  let prisma: PrismaService;
  let repo: AdminFinanceRepo;

  let fixerId: string;
  let jobIdA: string;
  let jobIdB: string;
  let earningIdA: string;
  let earningIdB: string;
  let withdrawalId: string;

  const testEmail = "admin_finance_concurrency_test@example.com";

  beforeAll(async () => {
    process.env.PRISMA_AUTO_CONNECT = "true";

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [
            ".env",
            ".env.local",
            "../../.env",
            "../../.env.local",
          ],
        }),
        PrismaModule,
      ],
      providers: [AdminFinanceRepo],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    repo = moduleRef.get(AdminFinanceRepo);
  }, 30000);

  beforeEach(async () => {
    await prisma.withdrawalAllocation.deleteMany({
      where: {
        withdrawal: {
          user: {
            email: testEmail,
          },
        },
      },
    });

    await prisma.withdrawalRequest.deleteMany({
      where: {
        user: {
          email: testEmail,
        },
      },
    });

    await prisma.fixerEarning.deleteMany({
      where: {
        fixer: {
          email: testEmail,
        },
      },
    });

    await prisma.job.deleteMany({
      where: {
        client: {
          email: testEmail,
        },
      },
    });

    await prisma.wallet.deleteMany({
      where: {
        user: {
          email: testEmail,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        fullName: "Admin Finance Concurrency Test",
        passwordHash: "x",
      },
    });

    fixerId = user.id;

    const jobA = await prisma.job.create({
      data: {
        clientId: fixerId,
        skillCategory: "Concurrency Test A",
        state: "Lagos",
        city: "Ikeja",
        priceMilliFec: 600,
      },
    });

    const jobB = await prisma.job.create({
      data: {
        clientId: fixerId,
        skillCategory: "Concurrency Test B",
        state: "Lagos",
        city: "Ikeja",
        priceMilliFec: 900,
      },
    });

    jobIdA = jobA.id;
    jobIdB = jobB.id;

    const earningA = await prisma.fixerEarning.create({
      data: {
        fixerId,
        jobId: jobIdA,
        amountMilliFec: 600,
        availableMilliFec: 600,
        status: "AVAILABLE",
      },
    });

    const earningB = await prisma.fixerEarning.create({
      data: {
        fixerId,
        jobId: jobIdB,
        amountMilliFec: 900,
        availableMilliFec: 900,
        status: "AVAILABLE",
      },
    });

    earningIdA = earningA.id;
    earningIdB = earningB.id;

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: fixerId,
        amountMilliFec: 1200,
        status: "PENDING",
      },
    });

    withdrawalId = withdrawal.id;

    await prisma.fixerEarning.update({
      where: {
        id: earningIdA,
      },
      data: {
        availableMilliFec: 0,
        status: "PARTIALLY_WITHDRAWN",
      },
    });

    await prisma.fixerEarning.update({
      where: {
        id: earningIdB,
      },
      data: {
        availableMilliFec: 300,
        status: "PARTIALLY_WITHDRAWN",
      },
    });

    await prisma.withdrawalAllocation.createMany({
      data: [
        {
          withdrawalId,
          earningId: earningIdA,
          amountMilliFec: 600,
        },
        {
          withdrawalId,
          earningId: earningIdB,
          amountMilliFec: 600,
        },
      ],
    });
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it(
    "prevents two concurrent rejection requests from restoring the same reserved earnings twice",
    async () => {
      const results = await Promise.allSettled([
        repo.rejectWithdrawal({
          withdrawalId,
          adminId: "admin-1",
          note: "Rejected by admin 1",
        }),
        repo.rejectWithdrawal({
          withdrawalId,
          adminId: "admin-2",
          note: "Rejected by admin 2",
        }),
      ]);

      const fulfilled = results.filter(
        (result) => result.status === "fulfilled",
      );

      const rejected = results.filter(
        (result) => result.status === "rejected",
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      expect(rejected[0].reason).toBeInstanceOf(Error);
      expect(rejected[0].reason.message).toBe("WITHDRAWAL_NOT_PENDING");

      const finalWithdrawal = await prisma.withdrawalRequest.findUnique({
        where: {
          id: withdrawalId,
        },
      });

      expect(finalWithdrawal?.status).toBe("REJECTED");

      const finalEarningA = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdA,
        },
      });

      const finalEarningB = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdB,
        },
      });

      expect(finalEarningA?.availableMilliFec).toBe(600);
      expect(finalEarningA?.status).toBe("AVAILABLE");

      expect(finalEarningB?.availableMilliFec).toBe(900);
      expect(finalEarningB?.status).toBe("AVAILABLE");

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          withdrawalId,
        },
      });

      expect(allocations).toHaveLength(0);
    },
    30000,
  );

  it(
    "allows only one winner when approve and reject happen concurrently",
    async () => {
      const results = await Promise.allSettled([
        repo.approveWithdrawal({
          withdrawalId,
          adminId: "admin-1",
          note: "Approved by admin 1",
        }),
        repo.rejectWithdrawal({
          withdrawalId,
          adminId: "admin-2",
          note: "Rejected by admin 2",
        }),
      ]);

      const fulfilled = results.filter(
        (result) => result.status === "fulfilled",
      );

      const rejected = results.filter(
        (result) => result.status === "rejected",
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const finalWithdrawal = await prisma.withdrawalRequest.findUnique({
        where: {
          id: withdrawalId,
        },
      });

      expect(["APPROVED", "REJECTED"]).toContain(finalWithdrawal?.status);

      expect(rejected[0].reason).toBeInstanceOf(Error);
      expect(rejected[0].reason.message).toBe("WITHDRAWAL_NOT_PENDING");

      const finalEarningA = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdA,
        },
      });

      const finalEarningB = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdB,
        },
      });

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          withdrawalId,
        },
        orderBy: {
          earningId: "asc",
        },
      });

      if (finalWithdrawal?.status === "REJECTED") {
        expect(finalEarningA?.availableMilliFec).toBe(600);
        expect(finalEarningA?.status).toBe("AVAILABLE");

        expect(finalEarningB?.availableMilliFec).toBe(900);
        expect(finalEarningB?.status).toBe("AVAILABLE");

        expect(allocations).toHaveLength(0);
      } else {
        expect(finalEarningA?.availableMilliFec).toBe(0);
        expect(finalEarningA?.status).toBe("PARTIALLY_WITHDRAWN");

        expect(finalEarningB?.availableMilliFec).toBe(300);
        expect(finalEarningB?.status).toBe("PARTIALLY_WITHDRAWN");

        expect(allocations).toHaveLength(2);

        const allocationA = allocations.find(
          (allocation) => allocation.earningId === earningIdA,
        );

        const allocationB = allocations.find(
          (allocation) => allocation.earningId === earningIdB,
        );

        expect(allocationA?.amountMilliFec).toBe(600);
        expect(allocationB?.amountMilliFec).toBe(600);
      }
    },
    30000,
  );

  it(
    "allows only one concurrent mark-paid request to transition an approved withdrawal",
    async () => {
      await prisma.withdrawalRequest.update({
        where: {
          id: withdrawalId,
        },
        data: {
          status: "APPROVED",
          reviewedBy: "approval-admin",
          reviewNote: "Approved for payment",
          reviewedAt: new Date(),
        },
      });

      const results = await Promise.allSettled([
        repo.markpaid({
          withdrawalId,
          adminId: "admin-1",
          note: "Paid by admin 1",
        }),
        repo.markpaid({
          withdrawalId,
          adminId: "admin-2",
          note: "Paid by admin 2",
        }),
      ]);

      const fulfilled = results.filter(
        (result) => result.status === "fulfilled",
      );

      const rejected = results.filter(
        (result) => result.status === "rejected",
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      expect(rejected[0].reason).toBeInstanceOf(Error);
      expect(rejected[0].reason.message).toBe("WITHDRAWAL_NOT_APPROVED");

      const finalWithdrawal = await prisma.withdrawalRequest.findUnique({
        where: {
          id: withdrawalId,
        },
      });

      expect(finalWithdrawal?.status).toBe("PAID");

      const finalEarningA = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdA,
        },
      });

      const finalEarningB = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdB,
        },
      });

      expect(finalEarningA?.availableMilliFec).toBe(0);
      expect(finalEarningA?.status).toBe("PAID");

      expect(finalEarningB?.availableMilliFec).toBe(300);
      expect(finalEarningB?.status).toBe("PARTIALLY_WITHDRAWN");

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          withdrawalId,
        },
        orderBy: {
          earningId: "asc",
        },
      });

      expect(allocations).toHaveLength(2);

      const allocationA = allocations.find(
        (allocation) => allocation.earningId === earningIdA,
      );

      const allocationB = allocations.find(
        (allocation) => allocation.earningId === earningIdB,
      );

      expect(allocationA?.amountMilliFec).toBe(600);
      expect(allocationB?.amountMilliFec).toBe(600);
    },
    30000,
  );

  it(
    "restores every earning correctly when a multi-earning withdrawal is rejected",
    async () => {
      const result = await repo.rejectWithdrawal({
        withdrawalId,
        adminId: "admin-1",
        note: "Multi-earning rejection test",
      });

      expect(result).toEqual({
  ok: true,
  status: "REJECTED",
});

      const finalWithdrawal = await prisma.withdrawalRequest.findUnique({
        where: {
          id: withdrawalId,
        },
      });

      expect(finalWithdrawal?.status).toBe("REJECTED");

      const finalEarningA = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdA,
        },
      });

      const finalEarningB = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdB,
        },
      });

      expect(finalEarningA?.availableMilliFec).toBe(600);
      expect(finalEarningA?.status).toBe("AVAILABLE");

      expect(finalEarningB?.availableMilliFec).toBe(900);
      expect(finalEarningB?.status).toBe("AVAILABLE");

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          withdrawalId,
        },
      });

      expect(allocations).toHaveLength(0);
    },
    30000,
  );

  it(
    "finalizes multiple earnings independently when a multi-earning withdrawal is marked paid",
    async () => {
      await prisma.withdrawalRequest.update({
        where: {
          id: withdrawalId,
        },
        data: {
          status: "APPROVED",
          reviewedBy: "approval-admin",
          reviewNote: "Approved for payment",
          reviewedAt: new Date(),
        },
      });

      const result = await repo.markpaid({
        withdrawalId,
        adminId: "admin-1",
        note: "Multi-earning paid test",
      });

      expect(result).toEqual({
  ok: true,
  status: "PAID",
});

      const finalWithdrawal = await prisma.withdrawalRequest.findUnique({
        where: {
          id: withdrawalId,
        },
      });

      expect(finalWithdrawal?.status).toBe("PAID");
      expect(finalWithdrawal?.paidAt).not.toBeNull();

      const finalEarningA = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdA,
        },
      });

      const finalEarningB = await prisma.fixerEarning.findUnique({
        where: {
          id: earningIdB,
        },
      });

      expect(finalEarningA?.availableMilliFec).toBe(0);
      expect(finalEarningA?.status).toBe("PAID");
      expect(finalEarningA?.paidAt).not.toBeNull();

      expect(finalEarningB?.availableMilliFec).toBe(300);
      expect(finalEarningB?.status).toBe("PARTIALLY_WITHDRAWN");
      expect(finalEarningB?.paidAt).toBeNull();

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          withdrawalId,
        },
        orderBy: {
          earningId: "asc",
        },
      });

      expect(allocations).toHaveLength(2);

      const allocationA = allocations.find(
        (allocation) => allocation.earningId === earningIdA,
      );

      const allocationB = allocations.find(
        (allocation) => allocation.earningId === earningIdB,
      );

      expect(allocationA?.amountMilliFec).toBe(600);
      expect(allocationB?.amountMilliFec).toBe(600);
    },
    30000,
  );
});