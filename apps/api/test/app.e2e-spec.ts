// Path: /apps/api/test/app.e2e-spec.ts
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

function randDigits(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

function uniqueBuffer(base: Buffer): Buffer {
  const extra = Buffer.from(`\n#e2e#${Date.now()}#${Math.random()}\n`);
  return Buffer.concat([base, extra]);
}

describe("App E2E", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    await request(app.getHttpServer())
      .get("/health")
      .expect(200)
      .expect({ status: "ok" });
  });

  it("Auth + Account flow (register/login/me/role switch)", async () => {
    const email = `user_${Date.now()}@example.com`;
    const password = "StrongPass123!";
    const fullName = "Test User";

    const regRes = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, fullName })
      .expect(201);

    expect(regRes.body.accessToken).toBeTruthy();

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(201);

    const token = loginRes.body.accessToken as string;
    expect(token).toBeTruthy();

    await request(app.getHttpServer())
      .get("/account/me")
      .expect(401);

    const meRes = await request(app.getHttpServer())
      .get("/account/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.email).toBe(email.toLowerCase());

    const switchRes = await request(app.getHttpServer())
      .post("/account/roles/switch")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "CLIENT" })
      .expect(201);

    expect(Array.isArray(switchRes.body.roles)).toBe(true);
    expect(switchRes.body.roles).toContain("CLIENT");
  });

  it("Verification: submit once, block second submission", async () => {
    const email = `ver_${Date.now()}@example.com`;
    const password = "StrongPass123!";
    const fullName = "Verify User";

    const regRes = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, fullName })
      .expect(201);

    const token = regRes.body.accessToken as string;

    const nin = randDigits(11);
    const bvn = randDigits(11);

    const dto = {
      bio: "I am a skilled worker.",
      skills: ["Plumbing", "Electrical"],
      address: {
        house: "12",
        street: "Allen Avenue",
        area: "Ikeja",
        busStop: "Allen",
        lga: "Ikeja",
        city: "Lagos",
        state: "Lagos"
      },
      instagram: "",
      tiktok: ""
    };

    const ninBuf = Buffer.from("nin-image");
    const selfieBuf = uniqueBuffer(Buffer.from("selfie-image"));
    const utilBuf = Buffer.from("utility-bill");

    const first = await request(app.getHttpServer())
      .post("/verification/submit")
      .set("Authorization", `Bearer ${token}`)
      .field("nin", nin)
      .field("bvn", bvn)
      .field("bio", dto.bio)
      .field("skills[]", dto.skills[0])
      .field("skills[]", dto.skills[1])
      .field("address[house]", dto.address.house)
      .field("address[street]", dto.address.street)
      .field("address[area]", dto.address.area)
      .field("address[busStop]", dto.address.busStop)
      .field("address[lga]", dto.address.lga)
      .field("address[city]", dto.address.city)
      .field("address[state]", dto.address.state)
      .field("instagram", dto.instagram)
      .field("tiktok", dto.tiktok)
      .attach("ninImage", ninBuf, { filename: "nin.png" })
      .attach("selfie", selfieBuf, { filename: "selfie.png" })
      .attach("utilityBill", utilBuf, { filename: "bill.png" })
      .expect(201);

    expect(first.body.status).toBeTruthy();

    await request(app.getHttpServer())
      .post("/verification/submit")
      .set("Authorization", `Bearer ${token}`)
      .field("nin", nin)
      .field("bvn", bvn)
      .field("bio", dto.bio)
      .field("skills[]", dto.skills[0])
      .field("skills[]", dto.skills[1])
      .field("address[house]", dto.address.house)
      .field("address[street]", dto.address.street)
      .field("address[area]", dto.address.area)
      .field("address[busStop]", dto.address.busStop)
      .field("address[lga]", dto.address.lga)
      .field("address[city]", dto.address.city)
      .field("address[state]", dto.address.state)
      .field("instagram", dto.instagram)
      .field("tiktok", dto.tiktok)
      .attach("ninImage", ninBuf, { filename: "nin.png" })
      .attach("selfie", selfieBuf, { filename: "selfie.png" })
      .attach("utilityBill", utilBuf, { filename: "bill.png" })
      .expect(409);
  });

  it("Wallet: deposit init + webhook simulate + withdraw request rules", async () => {
    const email = `wallet_${Date.now()}@example.com`;
    const password = "StrongPass123!";
    const fullName = "Wallet User";

    const regRes = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, fullName })
      .expect(201);

    const token = regRes.body.accessToken as string;

    const b0 = await request(app.getHttpServer())
      .get("/wallet/balance")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(b0.body.balanceMilliFec).toBe(0);

    const init = await request(app.getHttpServer())
      .post("/wallet/deposits/initiate")
      .set("Authorization", `Bearer ${token}`)
      .send({ amountMilliFec: 1500 })
      .expect(201);

    expect(init.body.paystackRef).toBeTruthy();

    await request(app.getHttpServer())
      .post("/wallet/deposits/webhook-simulate")
      .set("X-WEBHOOK-SECRET", process.env.WEBHOOK_SECRET ?? "dev_webhook_secret_123")
      .send({ paystackRef: init.body.paystackRef, status: "success" })
      .expect(201);

    const b1 = await request(app.getHttpServer())
      .get("/wallet/balance")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(b1.body.balanceMilliFec).toBe(1500);

    await request(app.getHttpServer())
      .post("/wallet/withdrawals/request")
      .set("Authorization", `Bearer ${token}`)
      .send({ amountMilliFec: 500 })
      .expect(403);

    await request(app.getHttpServer())
      .post("/account/roles/switch")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "FIXER" })
      .expect(201);

    const noBank = await request(app.getHttpServer())
      .post("/wallet/withdrawals/request")
      .set("Authorization", `Bearer ${token}`)
      .send({ amountMilliFec: 500 })
      .expect(201);

    expect(noBank.body.error).toBeTruthy();

    await request(app.getHttpServer())
      .post("/wallet/bank-details")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bankName: "GTBank",
        accountName: "Wallet User",
        accountNumber: "0123456789",
        bvn: randDigits(11)
      })
      .expect(201);

    const w = await request(app.getHttpServer())
      .post("/wallet/withdrawals/request")
      .set("Authorization", `Bearer ${token}`)
      .send({ amountMilliFec: 500 })
      .expect(201);

    expect(w.body.ok).toBe(true);

    const b2 = await request(app.getHttpServer())
      .get("/wallet/balance")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(b2.body.balanceMilliFec).toBe(1000);
  });
});
