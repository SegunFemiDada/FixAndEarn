// Path: apps/api/test/e2e/fixers.availability.e2e-spec.ts
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/infra/prisma/prisma.service";

describe("Fixers - Availability (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function registerAndLogin(email: string, password: string, role: "CLIENT" | "FIXER") {
    // register
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, fullName: role === "FIXER" ? "Fixer User" : "Client User", password, role })
      .expect(201);

    // login
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(201);

    const token = res.body?.accessToken ?? res.body?.token;
    expect(typeof token).toBe("string");

    // decode is not needed; fetch user by email
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user?.id) throw new Error("TEST_USER_NOT_FOUND");

    return { token, userId: user.id };
  }

  async function approveVerificationForUser(userId: string) {
    // Minimal verification row to satisfy APPROVED checks.
    // Uses unique hashes to avoid collisions across test runs.
    const uniq = `${Date.now()}-${Math.random()}`;

    await prisma.identityVerification.upsert({
      where: { userId },
      update: { status: "APPROVED" },
      create: {
        userId,
        ninHash: `nin-${uniq}`,
        bvnHash: `bvn-${uniq}`,
        faceHash: `face-${uniq}`,
        ninImagePath: "test/nin.png",
        selfieImagePath: "test/selfie.png",
        utilityBillPath: "test/bill.png",
        bio: "bio",
        skills: "plumbing",
        addressHouse: "1",
        addressStreet: "street",
        addressArea: "area",
        nearestBusStop: "bus stop",
        lga: "lga",
        city: "city",
        state: "state",
        status: "APPROVED",
      },
    });
  }

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("blocks availability for non-verified fixer", async () => {
    const { token } = await registerAndLogin(
      `fixer_nov_${Date.now()}@example.com`,
      "Passw0rd!",
      "FIXER"
    );

    await request(app.getHttpServer())
      .get("/fixers/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("blocks availability for verified non-fixer (client)", async () => {
    const { token, userId } = await registerAndLogin(
      `client_${Date.now()}@example.com`,
      "Passw0rd!",
      "CLIENT"
    );
    await approveVerificationForUser(userId);

    await request(app.getHttpServer())
      .get("/fixers/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("allows verified fixer to get + set preferred availability", async () => {
    const { token, userId } = await registerAndLogin(
      `fixer_${Date.now()}@example.com`,
      "Passw0rd!",
      "FIXER"
    );
    await approveVerificationForUser(userId);

    // default preferred is UNAVAILABLE
    const res1 = await request(app.getHttpServer())
      .get("/fixers/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res1.body).toHaveProperty("preferred");
    expect(res1.body).toHaveProperty("effective");
    expect(res1.body.preferred).toBe("UNAVAILABLE");

    // set AVAILABLE
    const res2 = await request(app.getHttpServer())
      .patch("/fixers/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "AVAILABLE" })
      .expect(200);

    expect(res2.body.preferred).toBe("AVAILABLE");
    expect(["AVAILABLE", "BUSY"]).toContain(res2.body.effective);
  });

  it("returns BUSY when fixer has an IN_PROGRESS job assigned", async () => {
    const { token, userId } = await registerAndLogin(
      `fixer_busy_${Date.now()}@example.com`,
      "Passw0rd!",
      "FIXER"
    );
    await approveVerificationForUser(userId);

    // Create a job with fixerId assigned + IN_PROGRESS
    const client = await prisma.user.create({
      data: {
        email: `client_for_busy_${Date.now()}@example.com`,
        fullName: "Client Busy",
        passwordHash: "DISABLED",
        isActive: true,
      },
      select: { id: true },
    });

    await prisma.job.create({
      data: {
        clientId: client.id,
        fixerId: userId,
        skillCategory: "Plumbing",
        state: "Lagos",
        city: "Ikeja",
        lga: "Ikeja",
        area: "Alausa",
        priceMilliFec: 1000,
        status: "IN_PROGRESS",
        lockedPriceMilliFec: 1000,
      },
    });

    // set preferred AVAILABLE
    await request(app.getHttpServer())
      .patch("/fixers/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "AVAILABLE" })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get("/fixers/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.preferred).toBe("AVAILABLE");
    expect(res.body.effective).toBe("BUSY");
  });
});