import { Test } from "@nestjs/testing";
import { JobCompletionService } from "./job-completion.service";
import { JobCompletionRepo } from "./job-completion.repo";
import { NotificationsService } from "../notifications/notifications.service";

describe("JobCompletionService", () => {
  let svc: JobCompletionService;
  let repo: any;
  let notifications: any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobCompletionService,
        {
          provide: JobCompletionRepo,
          useValue: {
            getJob: jest.fn(),
            getCompletionRequest: jest.fn(),
            requestCompletion: jest.fn(async () => ({
              ok: true,
            })),
            rejectCompletion: jest.fn(async () => ({
              ok: true,
            })),
            approveAndSettle: jest.fn(async () => ({
              ok: true,
              status: "COMPLETED",
              amountMilliFec: 1000,
              commissionMilliFec: 100,
              payoutMilliFec: 900,
            })),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(async () => undefined),
          },
        },
      ],
    }).compile();

    svc = moduleRef.get(JobCompletionService);
    repo = moduleRef.get(JobCompletionRepo);
    notifications = moduleRef.get(NotificationsService);
  });

  it("blocks fixer request if not assigned", async () => {
    repo.getJob.mockResolvedValue({
      id: "j1",
      clientId: "c1",
      status: "IN_PROGRESS",
      fixerId: "f2",
    });

    await expect(
      svc.requestCompletion("j1", "f1"),
    ).rejects.toBeTruthy();
  });

  it("blocks client approve if completion not requested", async () => {
    repo.getJob.mockResolvedValue({
      id: "j1",
      status: "IN_PROGRESS",
      clientId: "c1",
      fixerId: "f1",
      lockedPriceMilliFec: 1000,
      completedRequestedAt: null,
    });

    await expect(
      svc.approveCompletion({
        jobId: "j1",
        clientId: "c1",
        rating: 5,
      }),
    ).rejects.toBeTruthy();
  });

  it("approves and settles when valid", async () => {
    repo.getJob.mockResolvedValue({
      id: "j1",
      status: "IN_PROGRESS",
      clientId: "c1",
      fixerId: "f1",
      lockedPriceMilliFec: 1000,
      completedRequestedAt: new Date(),
    });

    const res = await svc.approveCompletion({
      jobId: "j1",
      clientId: "c1",
      rating: 5,
      comment: "Great job",
    });

    expect(res.status).toBe("COMPLETED");
    expect(repo.approveAndSettle).toHaveBeenCalledWith({
      jobId: "j1",
      clientId: "c1",
      fixerId: "f1",
      amountMilliFec: 1000,
      rating: 5,
      comment: "Great job",
    });

    expect(notifications.create).toHaveBeenCalled();
  });
});