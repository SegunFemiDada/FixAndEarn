import { JobPaymentsService } from "./job-payments.service";

describe("JobPaymentsService", () => {
  let service: JobPaymentsService;
  let prisma: any;
  let paymentProvider: any;

  beforeEach(() => {
    prisma = {
      job: {
        findUnique: jest.fn(),
      },
      jobPayment: {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
},
      user: {
        findUnique: jest.fn(),
      },
      negotiation: {
        findUnique: jest.fn(),
      },
    };

    paymentProvider = {
      initializeTransaction: jest.fn().mockResolvedValue({
        authorizationUrl: "https://checkout.example.com/pay",
        reference: "ref-123",
      }),
    };

    service = new JobPaymentsService(
      paymentProvider,
      prisma,
      {} as any,
      {} as any,
    );
  });

  it("rejects creating another POSTING payment while one is pending", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.jobPayment.findUnique.mockResolvedValue({
      status: "PENDING",
    });

    await expect(
      service.createPostingPayment({
        jobId: "job-1",
        clientId: "client-1",
      }),
    ).rejects.toThrow(
      "PAYMENT_ALREADY_PENDING",
    );

    expect(
      prisma.jobPayment.upsert
    ).not.toHaveBeenCalled();

    expect(
      paymentProvider.initializeTransaction
    ).not.toHaveBeenCalled();
  });
    it("rejects creating another URGENT payment while one is pending", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.job.findUnique.mockResolvedValue({
      clientId: "client-1",
    });

    prisma.jobPayment.findUnique.mockResolvedValue({
      status: "PENDING",
    });

    await expect(
      service.createUrgentHirePayment({
        jobId: "job-1",
        clientId: "client-1",
        fixerId: "fixer-1",
      }),
    ).rejects.toThrow(
      "PAYMENT_ALREADY_PENDING",
    );

    expect(
      prisma.jobPayment.upsert
    ).not.toHaveBeenCalled();

    expect(
      paymentProvider.initializeTransaction
    ).not.toHaveBeenCalled();
  });
  it("rejects a stale concurrent payment retry", async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: "job-1",
      clientId: "client-1",
      status: "DRAFT",
      postingType: "URGENT",
    });

    prisma.jobPayment.findMany.mockResolvedValue([
      {
        id: "urgent-payment",
        type: "URGENT",
        status: "PENDING",
        amountMilliFec: 2000,
        conversationId: "conversation-1",
        fixerId: "fixer-1",
        paymentReference: "old-reference",
      },
    ]);

    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.jobPayment.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      service.continuePayment({
        jobId: "job-1",
        clientId: "client-1",
      }),
    ).rejects.toThrow(
      "PAYMENT_RETRY_ALREADY_IN_PROGRESS",
    );

    expect(
      prisma.jobPayment.updateMany
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "urgent-payment",
          status: "PENDING",
          paymentReference: "old-reference",
        },
      }),
    );

    expect(
      paymentProvider.initializeTransaction
    ).not.toHaveBeenCalled();
  });

  it("continues an urgent hire payment when a pending urgent payment exists", async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: "job-1",
      clientId: "user-1",
      status: "DRAFT",
      postingType: "URGENT",
    });

    prisma.jobPayment.findMany.mockResolvedValue([
      {
        id: "posting-payment",
        type: "POSTING",
        status: "PENDING",
        amountMilliFec: 1000,
        conversationId: null,
        fixerId: null,
      },
      {
        id: "urgent-payment",
        type: "URGENT",
        status: "PENDING",
        amountMilliFec: 2000,
        conversationId: "conversation-1",
        fixerId: "fixer-1",
        paymentReference: "old-reference",
      },
    ]);

    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.jobPayment.updateMany.mockResolvedValue({count: 1});

    const result = await service.continuePayment({
      jobId: "job-1",
      clientId: "user-1",
    });

    expect(
  prisma.jobPayment.updateMany
).toHaveBeenCalledWith(
  expect.objectContaining({
    where: {
      id: "urgent-payment",
      status: "PENDING",
      paymentReference: "old-reference",
    },
    data: expect.objectContaining({
      paymentReference: expect.any(String),
      status: "PENDING",
      paidAt: null,
    }),
  }),
);

    expect(paymentProvider.initializeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amountKobo: 200000,
        reference: expect.any(String),
        metadata: expect.objectContaining({
          paymentType: "URGENT",
          jobId: "job-1",
          conversationId: "conversation-1",
          fixerId: "fixer-1",
        }),
      }),
    );

    expect(result).toEqual({
      authorizationUrl: "https://checkout.example.com/pay",
      reference: "ref-123",
    });
  });
  it("rejects creating another FINAL payment while one is still pending", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.job.findUnique.mockResolvedValue({
      clientId: "client-1",
      status: "OPEN",
    });

    prisma.negotiation.findUnique.mockResolvedValue({
      status: "AGREED",
      lockedPriceMilliFec: 5000,
      conversation: {
        id: "conversation-1",
        jobId: "job-1",
        fixerId: "fixer-1",
        status: "OPEN",
      },
    });

    prisma.jobPayment.findUnique.mockResolvedValue({
      status: "PENDING",
      expiresAt: new Date(
        Date.now() + 30 * 60 * 1000,
      ),
      paymentReference: "existing-final-reference",
    });

    await expect(
      service.createFinalPayment({
        jobId: "job-1",
        clientId: "client-1",
        conversationId: "conversation-1",
      }),
    ).rejects.toThrow(
      "FINAL_PAYMENT_ALREADY_PENDING",
    );

    expect(
      prisma.jobPayment.upsert
    ).not.toHaveBeenCalled();

    expect(
      paymentProvider.initializeTransaction
    ).not.toHaveBeenCalled();
  });

  it("rejects FINAL payment when the job is no longer OPEN", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.job.findUnique.mockResolvedValue({
      clientId: "client-1",
      status: "DRAFT",
    });

    await expect(
      service.createFinalPayment({
        jobId: "job-1",
        clientId: "client-1",
        conversationId: "conversation-1",
      }),
    ).rejects.toThrow(
      "FINAL_PAYMENT_NOT_AVAILABLE_FOR_JOB_STATUS",
    );

    expect(prisma.negotiation.findUnique).not.toHaveBeenCalled();
    expect(prisma.jobPayment.upsert).not.toHaveBeenCalled();
    expect(
      paymentProvider.initializeTransaction,
    ).not.toHaveBeenCalled();
  });

  it("rejects FINAL payment when the conversation belongs to another job", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.job.findUnique.mockResolvedValue({
      clientId: "client-1",
      status: "OPEN",
    });

    prisma.negotiation.findUnique.mockResolvedValue({
      status: "AGREED",
      lockedPriceMilliFec: 5000,
      conversation: {
        id: "conversation-1",
        jobId: "another-job",
        fixerId: "fixer-1",
        status: "OPEN",
      },
    });

    await expect(
      service.createFinalPayment({
        jobId: "job-1",
        clientId: "client-1",
        conversationId: "conversation-1",
      }),
    ).rejects.toThrow(
      "CONVERSATION_DOES_NOT_BELONG_TO_JOB",
    );

    expect(prisma.jobPayment.upsert).not.toHaveBeenCalled();
    expect(
      paymentProvider.initializeTransaction,
    ).not.toHaveBeenCalled();
  });

  it("rejects FINAL payment when the negotiation conversation is closed", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.job.findUnique.mockResolvedValue({
      clientId: "client-1",
      status: "OPEN",
    });

    prisma.negotiation.findUnique.mockResolvedValue({
      status: "AGREED",
      lockedPriceMilliFec: 5000,
      conversation: {
        id: "conversation-1",
        jobId: "job-1",
        fixerId: "fixer-1",
        status: "CLOSED",
      },
    });

    await expect(
      service.createFinalPayment({
        jobId: "job-1",
        clientId: "client-1",
        conversationId: "conversation-1",
      }),
    ).rejects.toThrow(
      "FINAL_PAYMENT_NOT_AVAILABLE_FOR_CLOSED_CONVERSATION",
    );

    expect(prisma.jobPayment.upsert).not.toHaveBeenCalled();
    expect(
      paymentProvider.initializeTransaction,
    ).not.toHaveBeenCalled();
  });
});