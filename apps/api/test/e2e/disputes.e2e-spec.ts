import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/infra/prisma/prisma.service";

describe("Disputes E2E", () => {
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

  it("opens a dispute only for IN_PROGRESS jobs and moves job to DISPUTED", async () => {
    const password = "StrongPass123!";

    // client
    const clientEmail = `d_client_${Date.now()}@example.com`;
    const clientReg = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: clientEmail, password, fullName: "Dispute Client" })
      .expect(201);
    const clientToken = clientReg.body.accessToken as string;

    // fixer
    const fixerEmail = `d_fixer_${Date.now()}@example.com`;
    const fixerReg = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: fixerEmail, password, fullName: "Dispute Fixer" })
      .expect(201);
    const fixerToken = fixerReg.body.accessToken as string;

    await request(app.getHttpServer())
      .post("/account/roles/switch")
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({ role: "FIXER" })
      .expect(201);

    const clientUser = await prisma.user.findUnique({ where: { email: clientEmail.toLowerCase() } });
    const fixerUser = await prisma.user.findUnique({ where: { email: fixerEmail.toLowerCase() } });

    expect(clientUser?.id).toBeTruthy();
    expect(fixerUser?.id).toBeTruthy();

    const job = await prisma.job.create({
      data: {
        clientId: clientUser!.id,
        fixerId: fixerUser!.id,
        skillCategory: "Plumbing",
        state: "Lagos",
        city: "Ikeja",
        lga: "Ikeja",
        area: "Allen",
        priceMilliFec: 3000,
        lockedPriceMilliFec: 3000,
        status: "IN_PROGRESS"
      }
    });

    // open dispute as fixer
    const open = await request(app.getHttpServer())
      .post(`/jobs/${job.id}/disputes`)
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({ reason: "Client is disputing workmanship quality.", evidence: { photo: "x" } })
      .expect(201);

    expect(open.body.ok).toBe(true);
    expect(open.body.disputeId).toBeTruthy();

    const jobAfter = await prisma.job.findUnique({ where: { id: job.id } });
    expect(jobAfter?.status).toBe("DISPUTED");

    // second dispute should be blocked
    await request(app.getHttpServer())
      .post(`/jobs/${job.id}/disputes`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ reason: "Second dispute attempt." })
      .expect(400);

    // cleanup
    await prisma.dispute.delete({ where: { jobId: job.id } });
    await prisma.job.delete({ where: { id: job.id } });
  });
});