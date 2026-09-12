import { JobModerationService } from "./job-moderation.service";

describe("JobModerationService", () => {
  let service: JobModerationService;

  const tx = {
    job: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    jobPayment: {
      findFirst: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(
      async (
        callback: (transaction: typeof tx) => Promise<unknown>
      ) => callback(tx)
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobModerationService(prisma as any);
  });

  describe("screenJob", () => {
    it("allows a normal skilled-service job", () => {
      const result = service.screenJob({
        skillCategory: "Plumbing",
        state: "Lagos",
        city: "Ikeja",
        lga: "Ikeja",
        area: "Allen",
      });

      expect(result).toEqual({
        status: "CLEAR",
        reason: null,
      });
    });

    it("flags an e-commerce goods listing", () => {
      const result = service.screenJob({
        skillCategory: "Sell laptop",
        state: "Lagos",
        city: "Ikeja",
      });

      expect(result.status).toBe("FLAGGED");
      expect(result.reason).toBe(
        "Jobs for selling or buying goods are not allowed."
      );
    });

    it("flags a goods-for-sale request", () => {
      const result = service.screenJob({
        skillCategory: "Selling products",
        state: "Lagos",
        city: "Ikeja",
        area: "Computer Village",
      });

      expect(result.status).toBe("FLAGGED");
      expect(result.reason).toBe(
        "Jobs for selling or buying goods are not allowed."
      );
    });

    it("flags transportation and ride-booking requests", () => {
      const result = service.screenJob({
        skillCategory: "Ride me to the airport",
        state: "Lagos",
        city: "Ikeja",
      });

      expect(result.status).toBe("FLAGGED");
      expect(result.reason).toBe(
        "Transportation and ride-booking requests are not allowed."
      );
    });

    it("flags financial solicitation", () => {
      const result = service.screenJob({
        skillCategory: "Investment opportunity",
        state: "Lagos",
        city: "Lekki",
      });

      expect(result.status).toBe("FLAGGED");
      expect(result.reason).toBe(
        "Financial solicitation or money-transfer requests are not allowed."
      );
    });

    it("flags prohibited or unsafe activity", () => {
      const result = service.screenJob({
        skillCategory: "Hack account",
        state: "Lagos",
        city: "Ikeja",
      });

      expect(result.status).toBe("FLAGGED");
      expect(result.reason).toBe(
        "Unauthorized access, hacking, or malicious cyber activity is not allowed."
      );
    });

    it("does not flag a legitimate service containing ordinary location words", () => {
      const result = service.screenJob({
        skillCategory: "Car repair technician",
        state: "Lagos",
        city: "Ikeja",
        lga: "Ikeja",
        area: "Allen",
      });

      expect(result).toEqual({
        status: "CLEAR",
        reason: null,
      });
    });
  });

  describe("flagJob", () => {
    it("flags a job and records the admin reason", async () => {
      const existingJob = {
        id: "job-1",
        postingType: "STANDARD",
        fixerId: null,
      };

      const updatedJob = {
        id: "job-1",
        moderationStatus: "FLAGGED",
        flagReason: "Goods-for-sale listing",
      };

      tx.job.findUnique.mockResolvedValue(existingJob);
      tx.job.update.mockResolvedValue(updatedJob);

      const result = await service.flagJob({
        jobId: "job-1",
        adminId: "admin-1",
        reason: "  Goods-for-sale listing  ",
      });

      expect(result).toEqual(updatedJob);

      expect(tx.job.findUnique).toHaveBeenCalledWith({
        where: {
          id: "job-1",
        },
        select: {
          id: true,
          postingType: true,
          fixerId: true,
        },
      });

      expect(tx.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "job-1",
          },
          data: expect.objectContaining({
            moderationStatus: "FLAGGED",
            flaggedByAdminId: "admin-1",
            flagReason: "Goods-for-sale listing",
            flaggedAt: expect.any(Date),
          }),
        })
      );
    });

    it("rejects an empty admin flag reason", async () => {
      await expect(
        service.flagJob({
          jobId: "job-1",
          adminId: "admin-1",
          reason: "   ",
        })
      ).rejects.toThrow("FLAG_REASON_REQUIRED");

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws when the job does not exist", async () => {
      tx.job.findUnique.mockResolvedValue(null);

      await expect(
        service.flagJob({
          jobId: "missing-job",
          adminId: "admin-1",
          reason: "Policy violation",
        })
      ).rejects.toThrow("JOB_NOT_FOUND");
    });

    it("closes an urgent conversation when an already-connected urgent job is flagged", async () => {
      tx.job.findUnique.mockResolvedValue({
        id: "job-urgent",
        postingType: "URGENT",
        fixerId: "fixer-1",
      });

      tx.job.update.mockResolvedValue({
        id: "job-urgent",
        moderationStatus: "FLAGGED",
      });

      await service.flagJob({
        jobId: "job-urgent",
        adminId: "admin-1",
        reason: "Policy violation",
      });

      expect(tx.conversation.updateMany).toHaveBeenCalledWith({
        where: {
          jobId: "job-urgent",
          fixerId: "fixer-1",
        },
        data: {
          status: "CLOSED",
          active: false,
        },
      });
    });
  });

  describe("unflagJob", () => {
    it("clears moderation metadata from a flagged standard job with successful posting payment", async () => {
      tx.job.findUnique.mockResolvedValue({
        id: "job-1",
        clientId: "client-1",
        status: "DRAFT",
        postingType: "STANDARD",
        moderationStatus: "FLAGGED",
      });

      tx.jobPayment.findFirst.mockResolvedValue({
        type: "POSTING",
        fixerId: null,
        conversationId: null,
      });

      tx.job.update.mockResolvedValue({
        id: "job-1",
        status: "OPEN",
        moderationStatus: "CLEAR",
        flaggedAt: null,
        flaggedByAdminId: null,
        flagReason: null,
      });

      const result = await service.unflagJob("job-1");

      expect(result).toEqual(
        expect.objectContaining({
          id: "job-1",
          status: "OPEN",
          moderationStatus: "CLEAR",
        })
      );

      expect(tx.job.update).toHaveBeenCalledWith({
        where: {
          id: "job-1",
        },
        data: {
          moderationStatus: "CLEAR",
          flaggedAt: null,
          flaggedByAdminId: null,
          flagReason: null,
          status: "OPEN",
        },
      });
    });

    it("restores a flagged urgent job and reopens its conversation after successful payment", async () => {
      tx.job.findUnique.mockResolvedValue({
        id: "job-urgent",
        clientId: "client-1",
        status: "DRAFT",
        postingType: "URGENT",
        moderationStatus: "FLAGGED",
      });

      tx.jobPayment.findFirst.mockResolvedValue({
        type: "URGENT",
        fixerId: "fixer-1",
        conversationId: "conversation-1",
      });

      tx.job.update.mockResolvedValue({
        id: "job-urgent",
        status: "OPEN",
        moderationStatus: "CLEAR",
        fixerId: "fixer-1",
      });

      const result = await service.unflagJob("job-urgent");

      expect(result).toEqual(
        expect.objectContaining({
          id: "job-urgent",
          status: "OPEN",
          moderationStatus: "CLEAR",
        })
      );

      expect(tx.job.update).toHaveBeenCalledWith({
        where: {
          id: "job-urgent",
        },
        data: {
          moderationStatus: "CLEAR",
          flaggedAt: null,
          flaggedByAdminId: null,
          flagReason: null,
          status: "OPEN",
          fixer: {
            connect: {
              id: "fixer-1",
            },
          },
        },
      });

      expect(tx.conversation.update).toHaveBeenCalledWith({
        where: {
          id: "conversation-1",
        },
        data: {
          status: "OPEN",
          active: true,
        },
      });
    });

    it("returns the job unchanged when it is already clear", async () => {
      const job = {
        id: "job-1",
        clientId: "client-1",
        status: "OPEN",
        postingType: "STANDARD",
        moderationStatus: "CLEAR",
      };

      tx.job.findUnique.mockResolvedValue(job);

      await expect(service.unflagJob("job-1")).resolves.toEqual(job);

      expect(tx.jobPayment.findFirst).not.toHaveBeenCalled();
      expect(tx.job.update).not.toHaveBeenCalled();
    });

    it("throws when the job does not exist", async () => {
      tx.job.findUnique.mockResolvedValue(null);

      await expect(
        service.unflagJob("missing-job")
      ).rejects.toThrow("JOB_NOT_FOUND");
    });
  });
});