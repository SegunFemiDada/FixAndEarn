import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AdminFinanceRepo } from "./admin-finance.repo";

describe("AdminFinanceRepo withdrawal concurrency", () => {
  let prisma: PrismaService;
  let repo: AdminFinanceRepo;

  let fixerId: string;
  let jobId: string;
  let earningId: string;
  let withdrawalId: string;

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
    const email = "admin_finance_concurrency_test@example.com";

    await prisma.withdrawalAllocation.deleteMany({
      where: {
        withdrawal: {
          user: {
            email,
          },
        },
      },
    });

    await prisma.withdrawalRequest.deleteMany({
      where: {
        user: {
          email,
        },
      },
    });

    await prisma.fixerEarning.deleteMany({
      where: {
        fixer: {
          email,
        },
      },
    });

    await prisma.job.deleteMany({
      where: {
        client: {
          email,
        },
      },
    });

    await prisma.wallet.deleteMany({
      where: {
        user: {
          email,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email,
      },
    });

    const user = await prisma.user.create({
      data: {
        email,
        fullName: "Admin Finance Concurrency Test",
        passwordHash: "x",
      },
    });

    fixerId = user.id;

    const job = await prisma.job.create({
      data: {
        clientId: fixerId,
        skillCategory: "Concurrency Test",
        state: "Lagos",
        city: "Ikeja",
        priceMilliFec: 1000,
      },
    });

    jobId = job.id;

    const earning = await prisma.fixerEarning.create({
      data: {
        fixerId,
        jobId,
        amountMilliFec: 1000,
        availableMilliFec: 0,
        status: "PARTIALLY_WITHDRAWN",
      },
    });

    earningId = earning.id;

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: fixerId,
        amountMilliFec: 1000,
        status: "PENDING",
      },
    });

    withdrawalId = withdrawal.id;

    await prisma.withdrawalAllocation.create({
      data: {
        withdrawalId,
        earningId,
        amountMilliFec: 1000,
      },
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

      const finalEarning = await prisma.fixerEarning.findUnique({
        where: {
          id: earningId,
        },
      });

      expect(finalEarning?.availableMilliFec).toBe(1000);
      expect(finalEarning?.status).toBe("AVAILABLE");

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

      const finalEarning = await prisma.fixerEarning.findUnique({
        where: {
          id: earningId,
        },
      });

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          withdrawalId,
        },
      });

      if (finalWithdrawal?.status === "REJECTED") {
        expect(rejected[0].reason.message).toBe("WITHDRAWAL_NOT_PENDING");

        expect(finalEarning?.availableMilliFec).toBe(1000);
        expect(finalEarning?.status).toBe("AVAILABLE");

        expect(allocations).toHaveLength(0);
      } else {
        expect(rejected[0].reason.message).toBe("WITHDRAWAL_NOT_PENDING");

        expect(finalEarning?.availableMilliFec).toBe(0);
        expect(finalEarning?.status).toBe("PARTIALLY_WITHDRAWN");

        expect(allocations).toHaveLength(1);
        expect(allocations[0]?.amountMilliFec).toBe(1000);
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

      const finalEarning = await prisma.fixerEarning.findUnique({
        where: {
          id: earningId,
        },
      });

      expect(finalEarning?.availableMilliFec).toBe(0);
      expect(finalEarning?.status).toBe("PAID");

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          withdrawalId,
        },
      });

      expect(allocations).toHaveLength(1);
      expect(allocations[0]?.amountMilliFec).toBe(1000);
    },
    30000,
  );
});