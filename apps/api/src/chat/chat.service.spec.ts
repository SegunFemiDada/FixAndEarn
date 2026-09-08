import {
  ForbiddenException,
  NotFoundException
} from "@nestjs/common";
import { ChatService } from "./chat.service";

describe("ChatService - Conversations + Safety + Negotiation Atomicity", () => {
  const repo: any = {
    getJob: jest.fn(),
    listConversationsForJob: jest.fn(),
    listMyConversations: jest.fn(),
    listModerationFlags: jest.fn(),
    getJobWithApplicant: jest.fn(),
    upsertConversation: jest.fn(),
    getConversationWithAgreements: jest.fn(),
    createMessage: jest.fn(),
    createModerationFlags: jest.fn(),
    ensureNegotiation: jest.fn(),
    updateNegotiation: jest.fn(),
    acceptAgreement: jest.fn(),
    getConversationByJobFixer: jest.fn(),
    getConversationMessages: jest.fn()
  };

  const moderationService: any = {
    scan: jest.fn().mockReturnValue([])
  };

  let transactionClient: any;

  const prisma: any = {
    user: {
      findUnique: jest.fn()
    },
    $transaction: jest.fn()
  };

  const notificationsService: any = {
    create: jest.fn()
  };

  const realtime: any = {
    roomFor: jest.fn(
      (jobId: string, fixerId: string) =>
        `job:${jobId}:fixer:${fixerId}`
    ),
    emitToRoom: jest.fn()
  };

  const jobPaymentsService: any = {
    createFinalPayment: jest.fn()
  };

  const svc = new ChatService(
    repo,
    moderationService,
    prisma,
    jobPaymentsService,
    notificationsService,
    realtime
  );

  beforeEach(() => {
    jest.clearAllMocks();

    transactionClient = {
      job: {
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn()
      },
      negotiation: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn()
      },
      conversation: {
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn()
      },
      ledgerEntry: {
        findUnique: jest.fn()
      },
      appMeta: {
        findUnique: jest.fn(),
        upsert: jest.fn()
      },
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      user: {
        create: jest.fn()
      }
    };

    prisma.$transaction.mockImplementation(
      async (fn: any) => fn(transactionClient)
    );

    notificationsService.create.mockResolvedValue({});
  });

  test("listJobConversations blocks non-owner", async () => {
    repo.getJob.mockResolvedValue({
      id: "job1",
      clientId: "clientA"
    });

    await expect(
      svc.listJobConversations(
        "job1",
        "clientB",
        { skip: 0, take: 20 } as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  test("sendMessage blocks when job is CANCELLED", async () => {
    repo.getJobWithApplicant.mockResolvedValue({
      id: "job1",
      clientId: "clientA",
      status: "CANCELLED",
      applications: [
        { fixerId: "fixerA" }
      ]
    });

    await expect(
      svc.sendMessage(
        "job1",
        "fixerA",
        "clientA",
        "hello"
      )
    ).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  test("sendMessage blocks when user is inactive", async () => {
    repo.getJobWithApplicant.mockResolvedValue({
      id: "job1",
      clientId: "clientA",
      status: "OPEN",
      applications: [
        { fixerId: "fixerA" }
      ]
    });

    prisma.user.findUnique.mockResolvedValue({
      isActive: false
    });

    await expect(
      svc.sendMessage(
        "job1",
        "fixerA",
        "clientA",
        "hello"
      )
    ).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  test("listJobConversations returns mapped summaries", async () => {
    repo.getJob.mockResolvedValue({
      id: "job1",
      clientId: "clientA"
    });

    repo.listConversationsForJob.mockResolvedValue([
      {
        id: "c1",
        jobId: "job1",
        fixer: {
          id: "fixerA",
          fullName: "Fixer A",
          email: "a@test.com",
          isActive: true
        },
        status: "OPEN",
        messages: [
          {
            createdAt:
              new Date(
                "2026-02-01T10:00:00Z"
              )
          }
        ],
        negotiation: {
          status: "OPEN",
          proposedPriceMilliFec: 1000,
          lockedPriceMilliFec: null,
          clientAcceptedAt: null,
          fixerAcceptedAt: null
        },
        updatedAt:
          new Date(
            "2026-02-01T10:01:00Z"
          )
      }
    ]);

    const res =
      await svc.listJobConversations(
        "job1",
        "clientA",
        {
          skip: 0,
          take: 20
        } as any
      );

    expect(res).toHaveLength(1);
    expect(res[0].conversationId).toBe("c1");
    expect(res[0].lastMessageAt).toBeTruthy();
  });

  test("listJobConversations throws when job missing", async () => {
    repo.getJob.mockResolvedValue(null);

    await expect(
      svc.listJobConversations(
        "job404",
        "clientA",
        {
          skip: 0,
          take: 20
        } as any
      )
    ).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  test("accepting a locked price atomically agrees negotiation and creates FINAL payment", async () => {
    repo.getJobWithApplicant.mockResolvedValue({
      id: "job1",
      clientId: "clientA",
      status: "OPEN",
      applications: [
        { fixerId: "fixerA" }
      ]
    });

    prisma.user.findUnique.mockResolvedValue({
      isActive: true
    });

    repo.upsertConversation.mockResolvedValue({
      id: "conversation1",
      jobId: "job1",
      fixerId: "fixerA",
      status: "OPEN"
    });

    repo.ensureNegotiation.mockResolvedValue({
      status: "LOCKED",
      lockedPriceMilliFec: 5000,
      lockedByUserId: "fixerA",
      clientAcceptedAt: null,
      fixerAcceptedAt: new Date(),
      proposedPriceMilliFec: 5000,
      agreedAt: null,
      rejectedAt: null,
      rejectedByUserId: null
    });

    transactionClient.negotiation.findUnique.mockResolvedValue({
      status: "LOCKED",
      lockedPriceMilliFec: 5000,
      lockedByUserId: "fixerA",
      clientAcceptedAt: null,
      fixerAcceptedAt: new Date(),
      proposedPriceMilliFec: 5000,
      agreedAt: null,
      rejectedAt: null,
      rejectedByUserId: null
    });

    transactionClient.negotiation.updateMany.mockResolvedValue({
      count: 1
    });

    transactionClient.job.update.mockResolvedValue({});
    transactionClient.conversation.updateMany.mockResolvedValue({
      count: 0
    });

    jobPaymentsService.createFinalPayment.mockResolvedValue({
      authorizationUrl:
        "https://checkout.example.com/pay",
      reference: "final-ref-123"
    });

    const result =
      await svc.respondToLockedPrice(
        "job1",
        "fixerA",
        "clientA",
        true
      );

    expect(
      transactionClient.negotiation.findUnique
    ).toHaveBeenCalledWith({
      where: {
        conversationId: "conversation1"
      }
    });

    expect(
      transactionClient.negotiation.updateMany
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          conversationId: "conversation1",
          status: "LOCKED"
        },
        data: expect.objectContaining({
          status: "AGREED"
        })
      })
    );

    expect(
      jobPaymentsService.createFinalPayment
    ).toHaveBeenCalledWith(
      {
        jobId: "job1",
        clientId: "clientA",
        conversationId: "conversation1"
      },
      transactionClient
    );

    expect(
      prisma.$transaction
    ).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      ok: true,
      status: "AGREED",
      payment: {
        authorizationUrl:
          "https://checkout.example.com/pay",
        reference: "final-ref-123"
      },
      paymentPendingForClient: true
    });

    expect(
      realtime.emitToRoom
    ).toHaveBeenCalledWith(
      "job:job1:fixer:fixerA",
      "negotiation:response",
      expect.objectContaining({
        status: "AGREED"
      })
    );

    expect(
      realtime.emitToRoom
    ).toHaveBeenCalledWith(
      "job:job1:fixer:fixerA",
      "payment:created",
      expect.objectContaining({
        authorizationUrl:
          "https://checkout.example.com/pay",
        reference: "final-ref-123"
      })
    );
  });

  test("does not overwrite a negotiation that is no longer LOCKED", async () => {
    repo.getJobWithApplicant.mockResolvedValue({
      id: "job1",
      clientId: "clientA",
      status: "OPEN",
      applications: [
        { fixerId: "fixerA" }
      ]
    });

    prisma.user.findUnique.mockResolvedValue({
      isActive: true
    });

    repo.upsertConversation.mockResolvedValue({
      id: "conversation1",
      jobId: "job1",
      fixerId: "fixerA",
      status: "OPEN"
    });

    repo.ensureNegotiation.mockResolvedValue({
      status: "LOCKED",
      lockedPriceMilliFec: 5000,
      lockedByUserId: "fixerA",
      clientAcceptedAt: null,
      fixerAcceptedAt: new Date(),
      proposedPriceMilliFec: 5000,
      agreedAt: null,
      rejectedAt: null,
      rejectedByUserId: null
    });

    transactionClient.negotiation.findUnique.mockResolvedValue({
      status: "AGREED",
      lockedPriceMilliFec: 5000,
      lockedByUserId: "fixerA",
      clientAcceptedAt: new Date(),
      fixerAcceptedAt: new Date(),
      proposedPriceMilliFec: 5000,
      agreedAt: new Date(),
      rejectedAt: null,
      rejectedByUserId: null
    });

    await expect(
      svc.respondToLockedPrice(
        "job1",
        "fixerA",
        "clientA",
        true
      )
    ).rejects.toThrow(
      "PRICE_NOT_LOCKED"
    );

    expect(
      transactionClient.negotiation.updateMany
    ).not.toHaveBeenCalled();

    expect(
      jobPaymentsService.createFinalPayment
    ).not.toHaveBeenCalled();

    expect(
      realtime.emitToRoom
    ).not.toHaveBeenCalled();
  });

  test("rolls back negotiation agreement when FINAL payment creation fails", async () => {
    repo.getJobWithApplicant.mockResolvedValue({
      id: "job1",
      clientId: "clientA",
      status: "OPEN",
      applications: [
        { fixerId: "fixerA" }
      ]
    });

    prisma.user.findUnique.mockResolvedValue({
      isActive: true
    });

    repo.upsertConversation.mockResolvedValue({
      id: "conversation1",
      jobId: "job1",
      fixerId: "fixerA",
      status: "OPEN"
    });

    repo.ensureNegotiation.mockResolvedValue({
      status: "LOCKED",
      lockedPriceMilliFec: 5000,
      lockedByUserId: "fixerA",
      clientAcceptedAt: null,
      fixerAcceptedAt: new Date(),
      proposedPriceMilliFec: 5000,
      agreedAt: null,
      rejectedAt: null,
      rejectedByUserId: null
    });

    transactionClient.negotiation.findUnique.mockResolvedValue({
      status: "LOCKED",
      lockedPriceMilliFec: 5000,
      lockedByUserId: "fixerA",
      clientAcceptedAt: null,
      fixerAcceptedAt: new Date(),
      proposedPriceMilliFec: 5000,
      agreedAt: null,
      rejectedAt: null,
      rejectedByUserId: null
    });

    transactionClient.negotiation.updateMany.mockResolvedValue({
      count: 1
    });

    transactionClient.job.update.mockResolvedValue({});
    transactionClient.conversation.updateMany.mockResolvedValue({
      count: 0
    });

    jobPaymentsService.createFinalPayment.mockRejectedValue(
      new Error("MONNIFY_INITIALIZATION_FAILED")
    );

    await expect(
      svc.respondToLockedPrice(
        "job1",
        "fixerA",
        "clientA",
        true
      )
    ).rejects.toThrow(
      "MONNIFY_INITIALIZATION_FAILED"
    );

    expect(
      transactionClient.negotiation.updateMany
    ).toHaveBeenCalled();

    expect(
      jobPaymentsService.createFinalPayment
    ).toHaveBeenCalled();

    /*
     * The real Prisma transaction rolls back the negotiation,
     * job and payment writes when the payment creation throws.
     */
    expect(
      realtime.emitToRoom
    ).not.toHaveBeenCalled();
  });
});