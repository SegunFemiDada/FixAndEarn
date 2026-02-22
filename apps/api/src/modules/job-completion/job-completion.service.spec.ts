import { Test } from "@nestjs/testing";
import { JobCompletionService } from "./job-completion.service";
import { JobCompletionRepo } from "./job-completion.repo";
import { JobsRepo } from "../jobs/jobs.repo";

describe("JobCompletionService", () => {
  let svc: JobCompletionService;
  let repo: any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobCompletionService,
        {
          provide: JobCompletionRepo,
          useValue: {
            getJob: jest.fn(),
            requestCompletion: jest.fn(async () => ({ ok: true })),
            rejectCompletion: jest.fn(async () => ({ ok: true })),
            approveAndSettle: jest.fn(async () => ({ ok: true, status: "COMPLETED" }))
          }
        },
        { provide: JobsRepo, useValue: {} }
      ]
    }).compile();

    svc = moduleRef.get(JobCompletionService);
    repo = moduleRef.get(JobCompletionRepo);
  });

  it("blocks fixer request if not assigned", async () => {
    repo.getJob.mockResolvedValue({ id: "j1", status: "IN_PROGRESS", fixerId: "f2" });
    await expect(svc.requestCompletion("j1", "f1")).rejects.toBeTruthy();
  });

  it("blocks client approve if completion not requested", async () => {
    repo.getJob.mockResolvedValue({
      id: "j1",
      status: "IN_PROGRESS",
      clientId: "c1",
      fixerId: "f1",
      lockedPriceMilliFec: 1000,
      completedRequestedAt: null
    });
    await expect(svc.approveCompletion({ jobId: "j1", clientId: "c1", stars: 5 })).rejects.toBeTruthy();
  });

  it("approves and settles when valid", async () => {
    repo.getJob.mockResolvedValue({
      id: "j1",
      status: "IN_PROGRESS",
      clientId: "c1",
      fixerId: "f1",
      lockedPriceMilliFec: 1000,
      completedRequestedAt: new Date()
    });

    const res = await svc.approveCompletion({ jobId: "j1", clientId: "c1", stars: 5, comment: "Great job" });
    expect(res.status).toBe("COMPLETED");
    expect(repo.approveAndSettle).toHaveBeenCalled();
  });
});
