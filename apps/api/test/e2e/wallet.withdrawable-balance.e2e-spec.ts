// Path: /apps/api/test/e2e/wallet.withdrawable-balance.e2e-spec.ts
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/infra/prisma/prisma.service";

function randDigits(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

describe("Wallet Withdrawable Balance E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("withdrawable balance excludes IN_PROGRESS job locked funds and blocks withdrawals above withdrawable", async () => {
    const fixerEmail = `fixer_${Date.now()}@example.com`;
    const clientEmail = `client_${Date.now()}@example.com`;
    const password = "StrongPass123!";
    const fullName = "Withdrawable Fixer";

    // Register fixer
    const fixerReg = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: fixerEmail, password, fullName })
      .expect(201);

    const fixerToken = fixerReg.body.accessToken as string;
    expect(fixerToken).toBeTruthy();

    // Switch to FIXER role
    await request(app.getHttpServer())
      .post("/account/roles/switch")
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({ role: "FIXER" })
      .expect(201);

    // Add bank details (required to request withdrawal)
    await request(app.getHttpServer())
      .post("/wallet/bank-details")
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({
        bankName: "GTBank",
        accountName: fullName,
        accountNumber: "0123456789",
        bvn: randDigits(11)
      })
      .expect(201);

    // Deposit 2000 milliFEC (first deposit max allowed by rules)
    const init = await request(app.getHttpServer())
      .post("/wallet/deposits/initiate")
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({ amountMilliFec: 2000 })
      .expect(201);

    await request(app.getHttpServer())
      .post("/wallet/deposits/webhook-simulate")
      .set("X-WEBHOOK-SECRET", process.env.WEBHOOK_SECRET ?? "dev_webhook_secret_123")
      .send({ paystackRef: init.body.paystackRef, status: "success" })
      .expect(201);

    // Register client (used only to satisfy Job.clientId relation)
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: clientEmail, password, fullName: "Job Client" })
      .expect(201);

    // Lookup ids via Prisma (no assumptions about token payload fields)
    const fixerUser = await prisma.user.findUnique({ where: { email: fixerEmail.toLowerCase() } });
    const clientUser = await prisma.user.findUnique({ where: { email: clientEmail.toLowerCase() } });

    expect(fixerUser?.id).toBeTruthy();
    expect(clientUser?.id).toBeTruthy();

    // Create an IN_PROGRESS job assigned to the fixer with locked funds of 1500 milliFEC
    const job = await prisma.job.create({
      data: {
        clientId: clientUser!.id,
        fixerId: fixerUser!.id,
        skillCategory: "Plumbing",
        state: "Lagos",
        city: "Ikeja",
        lga: "Ikeja",
        area: "Allen",
        priceMilliFec: 1500,
        lockedPriceMilliFec: 1500,
        status: "IN_PROGRESS"
      }
    });

    // Withdrawable should be 2000 - 1500 = 500
    const w0 = await request(app.getHttpServer())
      .get("/wallet/withdrawable-balance")
      .set("Authorization", `Bearer ${fixerToken}`)
      .expect(200);

    expect(w0.body.withdrawableBalanceMilliFec).toBe(500);

    // Request above withdrawable should be blocked
    const fail = await request(app.getHttpServer())
      .post("/wallet/withdrawals/request")
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({ amountMilliFec: 600 })
      .expect(201);

    expect(fail.body.error).toBe("Insufficient withdrawable balance.");

    // Request equal to withdrawable should succeed
    const ok = await request(app.getHttpServer())
      .post("/wallet/withdrawals/request")
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({ amountMilliFec: 500 })
      .expect(201);

    expect(ok.body.ok).toBe(true);

    // Wallet balance should now be 1500 (debit is immediate on request)
    const b1 = await request(app.getHttpServer())
      .get("/wallet/balance")
      .set("Authorization", `Bearer ${fixerToken}`)
      .expect(200);

    expect(b1.body.balanceMilliFec).toBe(1500);

    // Withdrawable should now be max(0, 1500 - 1500) = 0
    const w1 = await request(app.getHttpServer())
      .get("/wallet/withdrawable-balance")
      .set("Authorization", `Bearer ${fixerToken}`)
      .expect(200);

    expect(w1.body.withdrawableBalanceMilliFec).toBe(0);

    // Cleanup job to reduce cross-test pollution
    await prisma.job.delete({ where: { id: job.id } });
  });
});