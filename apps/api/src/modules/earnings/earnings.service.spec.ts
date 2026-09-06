import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EarningsRepo } from "./earnings.repo";
import { EarningsService } from "./earnings.service";
import { WithdrawalAllocationRepo } from "./withdrawal-allocation.repo";

describe("EarningsService withdrawal reservation concurrency", () => {
  let prisma: PrismaService;
  let earningsService: EarningsService;

  let fixerId: string;
  let jobId: string;

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
      providers: [
        EarningsRepo,
        WithdrawalAllocationRepo,
        EarningsService,
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    earningsService = moduleRef.get(EarningsService);
  }, 30000);

  beforeEach(async () => {
    const email = "earnings_concurrency_test@example.com";

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

    await prisma.user.deleteMany({
      where: {
        email,
      },
    });

    const user = await prisma.user.create({
      data: {
        email,
        fullName: "Earnings Concurrency Test",
        passwordHash: "x",
      },
    });

    fixerId = user.id;

    const job = await prisma.job.create({
      data: {
        clientId: user.id,
        skillCategory: "Concurrency Test",
        state: "Lagos",
        city: "Ikeja",
        priceMilliFec: 1000,
      },
    });

    jobId = job.id;

    await prisma.fixerEarning.create({
      data: {
        fixerId,
        jobId,
        amountMilliFec: 1000,
        availableMilliFec: 1000,
        status: "AVAILABLE",
      },
    });
  }, 30000);

  it(
    "allows multiple concurrent withdrawals when the total is within available earnings",
    async () => {
      const withdrawalA = await prisma.withdrawalRequest.create({
        data: {
          userId: fixerId,
          amountMilliFec: 300,
          status: "PENDING",
        },
      });

      const withdrawalB = await prisma.withdrawalRequest.create({
        data: {
          userId: fixerId,
          amountMilliFec: 300,
          status: "PENDING",
        },
      });

      const results = await Promise.all(
        [
          [withdrawalA.id, 300],
          [withdrawalB.id, 300],
        ].map(([withdrawalId, amount]) =>
          prisma.$transaction((tx) =>
            earningsService.reserveForWithdrawal(
              tx,
              fixerId,
              String(withdrawalId),
              Number(amount),
            ),
          ),
        ),
      );

      expect(results).toHaveLength(2);

      const earning = await prisma.fixerEarning.findUnique({
        where: {
          jobId,
        },
      });

      expect(earning?.availableMilliFec).toBe(400);
      expect(earning?.status).toBe("PARTIALLY_WITHDRAWN");

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          earningId: earning!.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      expect(allocations).toHaveLength(2);

      const totalAllocated = allocations.reduce(
        (sum, allocation) => sum + allocation.amountMilliFec,
        0,
      );

      expect(totalAllocated).toBe(600);
    },
    30000,
  );

  it(
    "prevents concurrent withdrawals from reserving more earnings than are available",
    async () => {
      const withdrawalA = await prisma.withdrawalRequest.create({
        data: {
          userId: fixerId,
          amountMilliFec: 700,
          status: "PENDING",
        },
      });

      const withdrawalB = await prisma.withdrawalRequest.create({
        data: {
          userId: fixerId,
          amountMilliFec: 700,
          status: "PENDING",
        },
      });

      const results = await Promise.allSettled(
        [
          [withdrawalA.id, 700],
          [withdrawalB.id, 700],
        ].map(([withdrawalId, amount]) =>
          prisma.$transaction((tx) =>
            earningsService.reserveForWithdrawal(
              tx,
              fixerId,
              String(withdrawalId),
              Number(amount),
            ),
          ),
        ),
      );

      const fulfilled = results.filter(
        (result) => result.status === "fulfilled",
      );

      const rejected = results.filter(
        (result) => result.status === "rejected",
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const earning = await prisma.fixerEarning.findUnique({
        where: {
          jobId,
        },
      });

      expect(earning?.availableMilliFec).toBe(300);
      expect(earning?.status).toBe("PARTIALLY_WITHDRAWN");

      const allocations = await prisma.withdrawalAllocation.findMany({
        where: {
          earningId: earning!.id,
        },
      });

      expect(allocations).toHaveLength(1);
      expect(allocations[0]?.amountMilliFec).toBe(700);
    },
    30000,
  );
});