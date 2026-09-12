import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AdminJobsService } from "./admin-jobs.service";
import { AdminJobsRepo } from "./admin-jobs.repo";
import { JobModerationService } from "../../modules/jobs/job-moderation.service";

describe("AdminJobsService", () => {
  let service: AdminJobsService;

  const repo = {
    listJobs: jest.fn(),
    getJob: jest.fn(),
    countFlaggedJobs: jest.fn(),
  };
  const moderation = {
  flagJob: jest.fn(),
  unflagJob: jest.fn(),
};

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
  AdminJobsService,
  {
    provide: AdminJobsRepo,
    useValue: repo,
  },
  {
    provide: JobModerationService,
    useValue: moderation,
  },
],
    }).compile();

    service = module.get(AdminJobsService);

    jest.clearAllMocks();
  });

  it("lists jobs with bounded pagination", async () => {
  repo.listJobs.mockResolvedValue({
    items: [],
    total: 0,
    skip: 0,
    take: 100,
  });

  repo.countFlaggedJobs.mockResolvedValue(0);

  const result = await service.list({
    skip: -20,
    take: 500,
  });

  expect(repo.listJobs).toHaveBeenCalledWith(
    expect.objectContaining({
      skip: 0,
      take: 100,
    })
  );

  expect(repo.countFlaggedJobs).toHaveBeenCalled();

  expect(result.total).toBe(0);
  expect(result.flaggedTotal).toBe(0);
});

  it("returns a job investigation record", async () => {
    const job = {
      id: "job-1",
      status: "OPEN",
    };

    repo.getJob.mockResolvedValue(job);

    await expect(
      service.getOne("job-1")
    ).resolves.toEqual(job);

    expect(repo.getJob).toHaveBeenCalledWith("job-1");
  });

  it("throws when the job does not exist", async () => {
    repo.getJob.mockResolvedValue(null);

    await expect(
      service.getOne("missing-job")
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});