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
    process.env.ADMIN_CREATE_BOOTSTRAP_ENABLED = "true";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
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
    const password = "VeryStrongPass123!";

    const boot = await request(app.getHttpServer())
      .post("/admin/bootstrap/super-admin")
      .send({
        email,
        fullName: "Super Admin",
        password,
      })
      .expect(201);

    const totpSecret = boot.body.totpSecret as string;

    expect(totpSecret).toBeTruthy();

    const totp = authenticator.generate(totpSecret);

    const login = await request(app.getHttpServer())
      .post("/admin/auth/login")
      .send({
        email,
        password,
        totp,
      })
      .expect(201);

    const token = login.body.accessToken as string;

    expect(token).toBeTruthy();

    return token;
  }

  async function createUserAndGetId(email: string) {
    const password = "StrongPass123!";

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email,
        password,
        fullName: "User",
      })
      .expect(201);

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    expect(user?.id).toBeTruthy();

    return user!.id;
  }

  async function createDisputedJob(args: {
    clientId: string;
    fixerId: string;
    amountMilliFec: number;
  }) {
    const job = await prisma.job.create({
      data: {
        clientId: args.clientId,
        fixerId: args.fixerId,
        skillCategory: "Plumbing",
        state: "Lagos",
        city: "Ikeja",
        lga: "Ikeja",
        area: "Allen",
        priceMilliFec: args.amountMilliFec,
        lockedPriceMilliFec: args.amountMilliFec,
        status: "DISPUTED",
      },
    });

    const dispute = await prisma.dispute.create({
      data: {
        jobId: job.id,
        openedByUserId: args.clientId,
        reason: "Dispute reason",
        status: "OPEN",
      },
    });

    return {
      job,
      dispute,
    };
  }

  it("Admin resolves dispute amicably without settlement, refund, or payout", async () => {
    const adminToken = await bootstrapAndLoginAdmin();

    const clientId = await createUserAndGetId(
      `client_${Date.now()}@example.com`,
    );

    const fixerId = await createUserAndGetId(
      `fixer_${Date.now()}@example.com`,
    );

    const amountMilliFec = 5000;

    const { job, dispute } = await createDisputedJob({
      clientId,
      fixerId,
      amountMilliFec,
    });

    const response = await request(app.getHttpServer())
      .post(
        `/admin/disputes/${dispute.id}/resolve-amicably`,
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`,
      )
      .expect(201);

    expect(response.body).toEqual({
      ok: true,
      status: "RESOLVED",
      mode: "AMICABLE",
    });

    const jobAfter = await prisma.job.findUnique({
      where: {
        id: job.id,
      },
    });

    expect(jobAfter?.status).toBe(
      "IN_PROGRESS",
    );

    expect(
      jobAfter?.completedRequestedAt,
    ).toBeNull();

    const disputeAfter =
      await prisma.dispute.findUnique({
        where: {
          id: dispute.id,
        },
      });

    expect(disputeAfter?.status).toBe(
      "RESOLVED",
    );


    expect(
      disputeAfter?.resolvedByAdminId,
    ).toBeTruthy();

    expect(
      disputeAfter?.resolvedAt,
    ).toBeTruthy();

    await prisma.dispute.delete({
      where: {
        id: dispute.id,
      },
    });

    await prisma.job.delete({
      where: {
        id: job.id,
      },
    });
  });

  it("Legacy financial dispute resolution endpoint is no longer available", async () => {
    const adminToken = await bootstrapAndLoginAdmin();

    const clientId = await createUserAndGetId(
      `client_${Date.now()}@example.com`,
    );

    const fixerId = await createUserAndGetId(
      `fixer_${Date.now()}@example.com`,
    );

    const { job, dispute } =
      await createDisputedJob({
        clientId,
        fixerId,
        amountMilliFec: 5000,
      });

    await request(app.getHttpServer())
      .post(
        `/admin/disputes/${dispute.id}/resolve`,
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`,
      )
      .send({})
      .expect(404);

    const disputeAfter =
      await prisma.dispute.findUnique({
        where: {
          id: dispute.id,
        },
      });

    expect(disputeAfter?.status).toBe(
      "OPEN",
    );

    const jobAfter = await prisma.job.findUnique({
      where: {
        id: job.id,
      },
    });

    expect(jobAfter?.status).toBe(
      "DISPUTED",
    );

    await prisma.dispute.delete({
      where: {
        id: dispute.id,
      },
    });

    await prisma.job.delete({
      where: {
        id: job.id,
      },
    });
  });
});