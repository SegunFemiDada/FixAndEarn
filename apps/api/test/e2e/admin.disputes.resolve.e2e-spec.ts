import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/infra/prisma/prisma.service";
import { authenticator } from "otplib";

describe("Admin Disputes Resolve E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Enable bootstrap for test run
    process.env.ADMIN_CREATE_BOOTSTRAP_ENABLED = "true";

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

  async function bootstrapAndLoginAdmin() {
    const email = `admin_${Date.now()}@example.com`;
    const password = "VeryStrongPass123!"; // >= 10 chars

    const boot = await request(app.getHttpServer())
      .post("/admin/bootstrap/super-admin")
      .send({ email, fullName: "Super Admin", password })
      .expect(201);

    const totpSecret = boot.body.totpSecret as string;
    expect(totpSecret).toBeTruthy();

    const totp = authenticator.generate(totpSecret);

    const login = await request(app.getHttpServer())
      .post("/admin/auth/login")
      .send({ email, password, totp })
      .expect(201);

    const token = login.body.accessToken as string;
    expect(token).toBeTruthy();
    return token;
  }

  async function createUserAndGetId(email: string) {
    const password = "StrongPass123!";
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, fullName: "User" })
      .expect(201);

    const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    expect(u?.id).toBeTruthy();
    return u!.id;
  }

  async function seedEscrowBalance(amountMilliFec: number) {
    // Create escrow user + wallet and set AppMeta key, if not present.
    const key = "ESCROW_USER_ID";

    const meta = await prisma.appMeta.findUnique({ where: { key } });
    if (meta?.value) {
      // Ensure wallet has enough balance
      const w = await prisma.wallet.findUnique({ where: { userId: meta.value } });
      if (!w) {
        await prisma.wallet.create({ data: { userId: meta.value, balanceMilliFec: amountMilliFec } });
      } else if (w.balanceMilliFec < amountMilliFec) {
        await prisma.wallet.update({
          where: { id: w.id },
          data: { balanceMilliFec: amountMilliFec }
        });
      }
      return meta.value;
    }

    const escrowUser = await prisma.user.create({
      data: {
        email: `escrow_${Date.now()}@fixandearn.internal`,
        fullName: "FixAndEarn Escrow",
        passwordHash: "DISABLED",
        isActive: true
      }
    });

    await prisma.wallet.create({
      data: { userId: escrowUser.id, balanceMilliFec: amountMilliFec }
    });

    await prisma.appMeta.upsert({
      where: { key },
      update: { value: escrowUser.id },
      create: { key, value: escrowUser.id }
    });

    return escrowUser.id;
  }

  it("Admin resolves dispute: RELEASE_TO_FIXER (escrow pays fixer + platform commission)", async () => {
    const adminToken = await bootstrapAndLoginAdmin();

    const clientId = await createUserAndGetId(`client_${Date.now()}@example.com`);
    const fixerId = await createUserAndGetId(`fixer_${Date.now()}@example.com`);

    const amount = 5000;
    const escrowUserId = await seedEscrowBalance(amount);

    // Create job in DISPUTED state
    const job = await prisma.job.create({
      data: {
        clientId,
        fixerId,
        skillCategory: "Plumbing",
        state: "Lagos",
        city: "Ikeja",
        lga: "Ikeja",
        area: "Allen",
        priceMilliFec: amount,
        lockedPriceMilliFec: amount,
        status: "DISPUTED"
      }
    });

    const dispute = await prisma.dispute.create({
      data: {
        jobId: job.id,
        openedByUserId: clientId,
        reason: "Dispute reason",
        status: "OPEN"
      }
    });

    const escrowWalletBefore = await prisma.wallet.findUnique({ where: { userId: escrowUserId } });
    expect(escrowWalletBefore?.balanceMilliFec).toBeGreaterThanOrEqual(amount);

    const res = await request(app.getHttpServer())
      .post(`/admin/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resolutionType: "RELEASE_TO_FIXER" })
      .expect(201);

    expect(res.body.ok).toBe(true);

    const jobAfter = await prisma.job.findUnique({ where: { id: job.id } });
    expect(jobAfter?.status).toBe("COMPLETED");

    const disputeAfter = await prisma.dispute.findUnique({ where: { id: dispute.id } });
    expect(disputeAfter?.status).toBe("RESOLVED");
    expect(disputeAfter?.resolutionType).toBe("RELEASE_TO_FIXER");

    const escrowWalletAfter = await prisma.wallet.findUnique({ where: { userId: escrowUserId } });
    expect(escrowWalletAfter?.balanceMilliFec).toBe((escrowWalletBefore!.balanceMilliFec - amount));

    const fixerWallet = await prisma.wallet.findUnique({ where: { userId: fixerId } });
    // payout = amount - floor(amount*0.1)
    const commission = Math.floor(amount * 0.1);
    const payout = amount - commission;
    expect(fixerWallet?.balanceMilliFec).toBe(payout);

    const platformWallet = await prisma.platformWallet.findFirst();
    expect(platformWallet?.balanceMilliFec).toBeGreaterThanOrEqual(commission);

    // cleanup
    await prisma.dispute.delete({ where: { id: dispute.id } });
    await prisma.job.delete({ where: { id: job.id } });
  });

  it("Admin resolves dispute: REFUND_TO_CLIENT (escrow refunds client)", async () => {
    const adminToken = await bootstrapAndLoginAdmin();

    const clientId = await createUserAndGetId(`client_${Date.now()}@example.com`);
    const fixerId = await createUserAndGetId(`fixer_${Date.now()}@example.com`);

    const amount = 4000;
    const escrowUserId = await seedEscrowBalance(amount);

    const job = await prisma.job.create({
      data: {
        clientId,
        fixerId,
        skillCategory: "Electrical",
        state: "Lagos",
        city: "Ikeja",
        priceMilliFec: amount,
        lockedPriceMilliFec: amount,
        status: "DISPUTED"
      }
    });

    const dispute = await prisma.dispute.create({
      data: {
        jobId: job.id,
        openedByUserId: fixerId,
        reason: "Dispute reason",
        status: "OPEN"
      }
    });

    const escrowWalletBefore = await prisma.wallet.findUnique({ where: { userId: escrowUserId } });

    const res = await request(app.getHttpServer())
      .post(`/admin/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resolutionType: "REFUND_TO_CLIENT" })
      .expect(201);

    expect(res.body.ok).toBe(true);

    const jobAfter = await prisma.job.findUnique({ where: { id: job.id } });
    expect(jobAfter?.status).toBe("CANCELLED");

    const clientWallet = await prisma.wallet.findUnique({ where: { userId: clientId } });
    expect(clientWallet?.balanceMilliFec).toBe(amount);

    const escrowWalletAfter = await prisma.wallet.findUnique({ where: { userId: escrowUserId } });
    expect(escrowWalletAfter?.balanceMilliFec).toBe((escrowWalletBefore!.balanceMilliFec - amount));

    // cleanup
    await prisma.dispute.delete({ where: { id: dispute.id } });
    await prisma.job.delete({ where: { id: job.id } });
  });
});