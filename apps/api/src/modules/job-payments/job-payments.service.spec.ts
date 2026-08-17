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
        update: jest.fn(),
      },
      user: {
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
      },
    ]);

    prisma.user.findUnique.mockResolvedValue({
      email: "client@example.com",
    });

    prisma.jobPayment.update.mockResolvedValue({});

    const result = await service.continuePayment({
      jobId: "job-1",
      clientId: "user-1",
    });

    expect(prisma.jobPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "urgent-payment" },
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
});
