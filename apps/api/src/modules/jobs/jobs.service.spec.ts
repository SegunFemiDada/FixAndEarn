// Path: apps/api/src/modules/jobs/jobs.service.spec.ts
import { Test } from "@nestjs/testing";
import { JobsService } from "./jobs.service";
import { JobsRepo } from "./jobs.repo";
import { LedgerService } from "../wallet/ledger.service";
import { WalletService } from "../wallet/wallet.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PlatformWalletService } from "../wallet/platform-wallet.service";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { JobPaymentsService } from "../job-payments/job-payments.service";

describe("JobsService", () => {
  let service: JobsService;
  let repo: any;
  let _walletService: any;
  let _ledgerService: any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: JobsRepo,
          useValue: {
            mockRepoMethods: jest.fn(),
            // Existing mocks
            findIdentityVerificationByUserId: jest.fn(async () => ({ id: "v1" })),
            createJob: jest.fn(async (d: any) => ({ id: "j1", ...d })),
            findJobById: jest.fn(),
            countApplications: jest.fn(async () => 0),
            updateJob: jest.fn(async () => ({ ok: true })),
            findApplication: jest.fn(async () => null),
            createApplication: jest.fn(async () => ({ id: "a1" })),
            listOpenJobs: jest.fn(async () => []),

            // Milestone G mocks
            upsertCompletionRequest: jest.fn(async (d: any) => ({ jobId: d.jobId, status: "PENDING" })),
            findCompletionRequest: jest.fn(async () => ({ jobId: "j1", status: "PENDING" })),
            rejectCompletionRequest: jest.fn(async () => ({ ok: true, status: "REJECTED" })),
          },
        },
        {
  provide: JobPaymentsService,
  useValue: {
    createPostingPayment: jest.fn(),
    createUrgentHirePayment: jest.fn(),
  },
},
        {
          provide: LedgerService,
          useValue: {
            mockLedgerMethods: jest.fn(),
            addEntry: jest.fn(async () => ({ ok: true })),
          },
        },
        {
          provide: WalletService,
          useValue: {
            mockWalletMethods: jest.fn(),
            getOrCreateWallet: jest.fn(async () => ({ id: "w1", balanceMilliFec: 999_999_999 })),
          },
        },
        {
        provide: NotificationsService,
        useValue: {
          create: jest.fn(),
        },
      },
      {
      provide: PlatformWalletService,
      useValue: {
        addEntry: jest.fn(),
      }
    },
    {
      provide: PrismaService,
      useValue: {},
    },
      ],
    }).compile();

    service = moduleRef.get(JobsService);
    
    repo = moduleRef.get(JobsRepo);
    _walletService = moduleRef.get(WalletService);
    _ledgerService = moduleRef.get(LedgerService);
  });

  it("blocks createJob if not verified", async () => {
    repo.findIdentityVerificationByUserId = jest.fn(async () => null);

    await expect(
      service.createJob({
        clientId: "u1",
        skillCategory: "Plumbing",
        state: "Lagos",
        city: "Ikeja",
        priceMilliFec: 1000,
      })
    ).rejects.toBeTruthy();
  });

  it("blocks edit after application exists", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", clientId: "u1", status: "OPEN" }));
    repo.countApplications = jest.fn(async () => 1);

    await expect(
      service.updateJob({
        jobId: "j1",
        clientId: "u1",
        patch: { priceMilliFec: 2000 },
      })
    ).rejects.toBeTruthy();
  });

  it("blocks applying to own job", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", clientId: "u1", status: "OPEN" }));

    await expect(
      service.applyToJob({
        jobId: "j1",
        fixerId: "u1",
      })
    ).rejects.toBeTruthy();
  });
});