import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ChatService } from "./chat.service";

describe("ChatService - Conversations + Safety", () => {
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
    updateNegotiation: jest.fn()
  };

  const moderation: any = { scan: jest.fn().mockReturnValue([]) };
  const prisma: any = {
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(async (fn: any) => fn({ job: { update: jest.fn() }, negotiation: { update: jest.fn() }, conversation: { update: jest.fn() } }))
  };

const walletService: any = {
  // add methods only if the tests call them
};

const ledgerService = {
  // mock only what is used
  transfer: jest.fn(),
};

const notificationsService = {
  create: jest.fn(),
};

const svc = new ChatService(
  repo,
  moderation,
  prisma,
  walletService,
  ledgerService as any,
  notificationsService as any,
);
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("listJobConversations blocks non-owner", async () => {
    repo.getJob.mockResolvedValue({ id: "job1", clientId: "clientA" });

    await expect(svc.listJobConversations("job1", "clientB", { skip: 0, take: 20 } as any)).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  test("sendMessage blocks when job is CANCELLED", async () => {
    repo.getJobWithApplicant.mockResolvedValue({
      id: "job1",
      clientId: "clientA",
      status: "CANCELLED",
      applications: [{ fixerId: "fixerA" }]
    });

    await expect(svc.sendMessage("job1", "fixerA", "clientA", "hello")).rejects.toBeInstanceOf(ForbiddenException);
  });

  test("sendMessage blocks when user is inactive", async () => {
    repo.getJobWithApplicant.mockResolvedValue({
      id: "job1",
      clientId: "clientA",
      status: "OPEN",
      applications: [{ fixerId: "fixerA" }]
    });

    prisma.user.findUnique.mockResolvedValue({ isActive: false });

    await expect(svc.sendMessage("job1", "fixerA", "clientA", "hello")).rejects.toBeInstanceOf(ForbiddenException);
  });

  test("listJobConversations returns mapped summaries", async () => {
    repo.getJob.mockResolvedValue({ id: "job1", clientId: "clientA" });
    repo.listConversationsForJob.mockResolvedValue([
      {
        id: "c1",
        jobId: "job1",
        fixer: { id: "fixerA", fullName: "Fixer A", email: "a@test.com", isActive: true },
        status: "OPEN",
        messages: [{ createdAt: new Date("2026-02-01T10:00:00Z") }],
        negotiation: { status: "OPEN", proposedPriceMilliFec: 1000, lockedPriceMilliFec: null, clientAcceptedAt: null, fixerAcceptedAt: null },
        updatedAt: new Date("2026-02-01T10:01:00Z")
      }
    ]);

    const res = await svc.listJobConversations("job1", "clientA", { skip: 0, take: 20 } as any);
    expect(res).toHaveLength(1);
    expect(res[0].conversationId).toBe("c1");
    expect(res[0].lastMessageAt).toBeTruthy();
  });

  test("listJobConversations throws when job missing", async () => {
    repo.getJob.mockResolvedValue(null);
    await expect(svc.listJobConversations("job404", "clientA", { skip: 0, take: 20 } as any)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
