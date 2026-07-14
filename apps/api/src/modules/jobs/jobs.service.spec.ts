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
            findAgreedFixerIdForJob: jest.fn(async () => "f1"),
            upsertCompletionRequest: jest.fn(async (d: any) => ({ jobId: d.jobId, status: "PENDING" })),
            findCompletionRequest: jest.fn(async () => ({ jobId: "j1", status: "PENDING" })),
            approveCompletionAndPay: jest.fn(async () => ({ ok: true, status: "COMPLETED" })),
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

  // ==========================
  // Milestone G tests
  // ==========================

  it("requestCompletion blocks if job not found", async () => {
    repo.findJobById = jest.fn(async () => null);

    await expect(
      service.requestCompletion({
        jobId: "j404",
        fixerId: "f1",
      })
    ).rejects.toBeTruthy();
  });

  it("requestCompletion blocks if job not IN_PROGRESS", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "OPEN", clientId: "c1" }));

    await expect(
      service.requestCompletion({
        jobId: "j1",
        fixerId: "f1",
      })
    ).rejects.toBeTruthy();
  });

  it("requestCompletion blocks if requester is not assigned fixer", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findAgreedFixerIdForJob = jest.fn(async () => "someoneElse");

    await expect(
      service.requestCompletion({
        jobId: "j1",
        fixerId: "f1",
      })
    ).rejects.toBeTruthy();
  });

  it("requestCompletion upserts completion request on happy path", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findAgreedFixerIdForJob = jest.fn(async () => "f1");
    repo.upsertCompletionRequest = jest.fn(async () => ({ jobId: "j1", status: "PENDING" }));

    const res = await service.requestCompletion({
      jobId: "j1",
      fixerId: "f1",
      note: "done",
    });

    expect(repo.upsertCompletionRequest).toHaveBeenCalledWith({ jobId: "j1", fixerId: "f1", note: "done" });
    expect(res.status).toBe("PENDING");
  });

  it("approveCompletion blocks if job not IN_PROGRESS", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "OPEN", clientId: "c1" }));

    await expect(
      service.approveCompletion({
        jobId: "j1",
        clientId: "c1",
        rating: 5,
      })
    ).rejects.toBeTruthy();
  });

  it("approveCompletion blocks if no completion request", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findCompletionRequest = jest.fn(async () => null);

    await expect(
      service.approveCompletion({
        jobId: "j1",
        clientId: "c1",
        rating: 5,
      })
    ).rejects.toBeTruthy();
  });

  it("approveCompletion returns ALREADY_APPROVED", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findCompletionRequest = jest.fn(async () => ({ jobId: "j1", status: "APPROVED" }));

    const res = await service.approveCompletion({
      jobId: "j1",
      clientId: "c1",
      rating: 5,
    });

    expect(res.status).toBe("ALREADY_APPROVED");
  });

  it("approveCompletion calls approveCompletionAndPay on happy path", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findCompletionRequest = jest.fn(async () => ({ jobId: "j1", status: "PENDING" }));
    repo.approveCompletionAndPay = jest.fn(async () => ({ ok: true, status: "COMPLETED" }));

    const res = await service.approveCompletion({
      jobId: "j1",
      clientId: "c1",
      rating: 5,
      comment: "nice",
    });

    expect(repo.approveCompletionAndPay).toHaveBeenCalledWith({
      jobId: "j1",
      clientId: "c1",
      rating: 5,
      comment: "nice",
    });
    expect(res.status).toBe("COMPLETED");
  });

  it("rejectCompletion blocks if no completion request", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findCompletionRequest = jest.fn(async () => null);

    await expect(
      service.rejectCompletion({
        jobId: "j1",
        clientId: "c1",
        reason: "not done",
      })
    ).rejects.toBeTruthy();
  });

  it("rejectCompletion returns ALREADY_REJECTED", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findCompletionRequest = jest.fn(async () => ({ jobId: "j1", status: "REJECTED" }));

    const res = await service.rejectCompletion({
      jobId: "j1",
      clientId: "c1",
      reason: "not done",
    });

    expect(res.status).toBe("ALREADY_REJECTED");
  });

  it("rejectCompletion blocks if already approved", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findCompletionRequest = jest.fn(async () => ({ jobId: "j1", status: "APPROVED" }));

    await expect(
      service.rejectCompletion({
        jobId: "j1",
        clientId: "c1",
        reason: "late",
      })
    ).rejects.toBeTruthy();
  });

  it("rejectCompletion calls rejectCompletionRequest on happy path", async () => {
    repo.findJobById = jest.fn(async () => ({ id: "j1", status: "IN_PROGRESS", clientId: "c1" }));
    repo.findCompletionRequest = jest.fn(async () => ({ jobId: "j1", status: "PENDING" }));
    repo.rejectCompletionRequest = jest.fn(async () => ({ ok: true, status: "REJECTED" }));

    const res = await service.rejectCompletion({
      jobId: "j1",
      clientId: "c1",
      reason: "not done",
    });

    expect(repo.rejectCompletionRequest).toHaveBeenCalledWith({ jobId: "j1", clientId: "c1", reason: "not done" });
    expect(res.status).toBe("REJECTED");
  });
});