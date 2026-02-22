// Path: /apps/api/test/jobs.e2e-spec.ts
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

async function registerAndGetToken(app: INestApplication, prefix: string) {
  const email = `${prefix}_${Date.now()}@example.com`;
  const password = "StrongPass123!";
  const fullName = `${prefix} User`;

  const regRes = await request(app.getHttpServer())
    .post("/auth/register")
    .send({ email, password, fullName })
    .expect(201);

  return regRes.body.accessToken as string;
}

async function submitVerification(app: INestApplication, token: string) {
  const nin = randDigits(11);
  const bvn = randDigits(11);

  const ninBuf = Buffer.from("nin-image");
  const selfieBuf = uniqueBuffer(Buffer.from("selfie-image"));
  const utilBuf = Buffer.from("utility-bill");

  await request(app.getHttpServer())
    .post("/verification/submit")
    .set("Authorization", `Bearer ${token}`)
    .field("nin", nin)
    .field("bvn", bvn)
    .field("bio", "Verified user")
    .field("skills[]", "Plumbing")
    .field("address[house]", "12")
    .field("address[street]", "Allen Avenue")
    .field("address[area]", "Ikeja")
    .field("address[busStop]", "Allen")
    .field("address[lga]", "Ikeja")
    .field("address[city]", "Lagos")
    .field("address[state]", "Lagos")
    .attach("ninImage", ninBuf, { filename: "nin.png" })
    .attach("selfie", selfieBuf, { filename: "selfie.png" })
    .attach("utilityBill", utilBuf, { filename: "bill.png" })
    .expect(201);
}

describe("Jobs E2E", () => {
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

  it("Client can post job only after verification; edit locks after fixer applies", async () => {
    const clientToken = await registerAndGetToken(app, "client");
    // switch to CLIENT
    await request(app.getHttpServer())
      .post("/account/roles/switch")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ role: "CLIENT" })
      .expect(201);

    // not verified -> forbidden
    await request(app.getHttpServer())
      .post("/jobs")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ skillCategory: "Plumbing", state: "Lagos", city: "Ikeja", priceMilliFec: 1500 })
      .expect(403);

    // verify, then create
    await submitVerification(app, clientToken);

    const created = await request(app.getHttpServer())
      .post("/jobs")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ skillCategory: "Plumbing", state: "Lagos", city: "Ikeja", priceMilliFec: 1500 })
      .expect(201);

    const jobId = created.body.id as string;
    expect(jobId).toBeTruthy();

    // shows in marketplace
    const list = await request(app.getHttpServer())
      .get("/jobs")
      .set("Authorization", `Bearer ${clientToken}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.some((j: any) => j.id === jobId)).toBe(true);

    // edit allowed before any application
    await request(app.getHttpServer())
      .patch(`/jobs/${jobId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ priceMilliFec: 2000 })
      .expect(200);

    // Fixer applies
    const fixerToken = await registerAndGetToken(app, "fixer");
    await request(app.getHttpServer())
      .post("/account/roles/switch")
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({ role: "FIXER" })
      .expect(201);

    await submitVerification(app, fixerToken);

    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/apply`)
      .set("Authorization", `Bearer ${fixerToken}`)
      .send({ note: "I can handle it." })
      .expect(201);

    // edit now blocked
    await request(app.getHttpServer())
      .patch(`/jobs/${jobId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ priceMilliFec: 2500 })
      .expect(409);
  });
});
