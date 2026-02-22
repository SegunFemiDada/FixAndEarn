// Path: /apps/api/src/modules/wallet/wallet.service.spec.ts
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { LedgerEntryDirection, LedgerEntryType } from "@prisma/client";

describe("Wallet + Ledger", () => {
  let walletService: WalletService;
  let ledgerService: LedgerService;
  let prisma: PrismaService;

  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    process.env.PRISMA_AUTO_CONNECT = "true";

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [".env", ".env.local", "../../.env", "../../.env.local"]
        }),
        PrismaModule
      ],
      providers: [WalletService, LedgerService]
    }).compile();

    walletService = moduleRef.get(WalletService);
    ledgerService = moduleRef.get(LedgerService);
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    // Clean prior test users by email prefix
    const emails = ["wallet_test_a@example.com", "wallet_test_b@example.com"];

    // Delete dependent tables first
    await prisma.ledgerEntry.deleteMany({
      where: { wallet: { user: { email: { in: emails } } } }
    });

    await prisma.wallet.deleteMany({
      where: { user: { email: { in: emails } } }
    });

    await prisma.userRole.deleteMany({
      where: { user: { email: { in: emails } } }
    });

    await prisma.identityVerification.deleteMany({
      where: { user: { email: { in: emails } } }
    });

    await prisma.bankDetails.deleteMany({
      where: { user: { email: { in: emails } } }
    });

    await prisma.depositIntent.deleteMany({
      where: { user: { email: { in: emails } } }
    });

    await prisma.withdrawalRequest.deleteMany({
      where: { user: { email: { in: emails } } }
    });

    await prisma.user.deleteMany({
      where: { email: { in: emails } }
    });

    // Create fresh users for each test
    const a = await prisma.user.create({
      data: {
        email: "wallet_test_a@example.com",
        fullName: "Wallet Test A",
        passwordHash: "x"
      }
    });

    const b = await prisma.user.create({
      data: {
        email: "wallet_test_b@example.com",
        fullName: "Wallet Test B",
        passwordHash: "x"
      }
    });

    userAId = a.id;
    userBId = b.id;
  });

  it("credits and debits correctly in milliFEC", async () => {
    await ledgerService.addEntry({
      userId: userAId,
      type: LedgerEntryType.DEPOSIT,
      direction: LedgerEntryDirection.CREDIT,
      amountMilliFec: 7500, // 7.5 FEC
      idempotencyKey: `credit-1-${Date.now()}`
    });

    await ledgerService.addEntry({
      userId: userAId,
      type: LedgerEntryType.WITHDRAWAL_REQUEST,
      direction: LedgerEntryDirection.DEBIT,
      amountMilliFec: 2500, // 2.5 FEC
      idempotencyKey: `debit-1-${Date.now()}`
    });

    const wallet = await prisma.wallet.findUnique({
      where: { userId: userAId }
    });

    expect(wallet?.balanceMilliFec).toBe(5000); // 5.0 FEC
  });

  it("blocks duplicate ledger entries", async () => {
    const dupKey = `dup-key-${Date.now()}`;

    await ledgerService.addEntry({
      userId: userBId,
      type: LedgerEntryType.DEPOSIT,
      direction: LedgerEntryDirection.CREDIT,
      amountMilliFec: 1000,
      idempotencyKey: dupKey
    });

    await expect(
      ledgerService.addEntry({
        userId: userBId,
        type: LedgerEntryType.DEPOSIT,
        direction: LedgerEntryDirection.CREDIT,
        amountMilliFec: 1000,
        idempotencyKey: dupKey
      })
    ).rejects.toThrow();
  });
});
