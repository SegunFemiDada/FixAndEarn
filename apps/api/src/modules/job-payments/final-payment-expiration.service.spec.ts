import { FinalPaymentExpirationService } from "./final-payment-expiration.service";

describe("FinalPaymentExpirationService", () => {
  let service: FinalPaymentExpirationService;
  let prisma: any;
  let notifications: any;
  let realtime: any;
  let tx: any;

  const payment = {
    id: "payment-1",
    jobId: "job-1",
    fixerId: "fixer-1",
    conversationId: "conversation-1",
    expiresAt: new Date("2026-09-05T23:00:00.000Z"),
    job: {
      clientId: "client-1",
      status: "OPEN",
      postingType: "STANDARD",
    },
  };

  beforeEach(() => {
    tx = {
      jobPayment: {
        updateMany: jest.fn(),
      },
      job: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      conversation: {
        updateMany: jest.fn(),
      },
    };

    prisma = {
      jobPayment: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) =>
        callback(tx),
      ),
    };

    notifications = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    realtime = {
      roomFor: jest.fn().mockReturnValue("room-1"),
      emitToRoom: jest.fn(),
    };

    service = new FinalPaymentExpirationService(
      prisma,
      notifications,
      realtime,
    );
  });

  it("does not reset the job when the current job state is no longer OPEN", async () => {
    prisma.jobPayment.findMany.mockResolvedValue([payment]);

    tx.jobPayment.updateMany.mockResolvedValue({
      count: 1,
    });

    tx.job.findUnique.mockResolvedValue({
      status: "IN_PROGRESS",
      postingType: "STANDARD",
    });

    await service.expirePendingFinalPayments();

    expect(tx.job.findUnique).toHaveBeenCalledWith({
      where: {
        id: "job-1",
      },
      select: {
        status: true,
        postingType: true,
      },
    });

    expect(tx.job.update).not.toHaveBeenCalled();

    expect(tx.conversation.updateMany).not.toHaveBeenCalled();

    expect(notifications.create).toHaveBeenCalled();
  });

  it("returns a STANDARD job to OPEN when the expired payment belongs to an OPEN job", async () => {
    prisma.jobPayment.findMany.mockResolvedValue([payment]);

    tx.jobPayment.updateMany.mockResolvedValue({
      count: 1,
    });

    tx.job.findUnique.mockResolvedValue({
      status: "OPEN",
      postingType: "STANDARD",
    });

    tx.job.update.mockResolvedValue({});
    tx.conversation.updateMany.mockResolvedValue({ count: 1 });

    await service.expirePendingFinalPayments();

    expect(tx.job.update).toHaveBeenCalledWith({
      where: {
        id: "job-1",
      },
      data: {
        status: "OPEN",
        fixerId: null,
        lockedPriceMilliFec: null,
      },
    });

    expect(tx.conversation.updateMany).toHaveBeenCalledWith({
      where: {
        id: "conversation-1",
      },
      data: {
        status: "CLOSED",
        active: false,
      },
    });
  });

  it("moves an URGENT job to DRAFT when the expired payment belongs to an OPEN job", async () => {
    prisma.jobPayment.findMany.mockResolvedValue([
      {
        ...payment,
        job: {
          ...payment.job,
          postingType: "URGENT",
        },
      },
    ]);

    tx.jobPayment.updateMany.mockResolvedValue({
      count: 1,
    });

    tx.job.findUnique.mockResolvedValue({
      status: "OPEN",
      postingType: "URGENT",
    });

    tx.job.update.mockResolvedValue({});
    tx.conversation.updateMany.mockResolvedValue({ count: 1 });

    await service.expirePendingFinalPayments();

    expect(tx.job.update).toHaveBeenCalledWith({
      where: {
        id: "job-1",
      },
      data: {
        status: "DRAFT",
        fixerId: null,
        lockedPriceMilliFec: null,
      },
    });
  });

  it("does not process a payment when another process already claimed it", async () => {
    prisma.jobPayment.findMany.mockResolvedValue([payment]);

    tx.jobPayment.updateMany.mockResolvedValue({
      count: 0,
    });

    await service.expirePendingFinalPayments();

    expect(tx.job.findUnique).not.toHaveBeenCalled();
    expect(tx.job.update).not.toHaveBeenCalled();
    expect(tx.conversation.updateMany).not.toHaveBeenCalled();
    expect(notifications.create).not.toHaveBeenCalled();
    expect(realtime.emitToRoom).not.toHaveBeenCalled();
  });
});