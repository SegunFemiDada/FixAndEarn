// Path: /apps/api/test/e2e/chat.e2e-spec.ts
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";

// keep the rest of your test file exactly the same below this line

describe('E2E - Chat + Negotiation (Milestone F)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('agreement is required before messaging', async () => {
    // NOTE: Replace these with your existing helpers.
    // Assumptions:
    // - client creates OPEN job
    // - fixer applies to job
    const clientToken = 'REPLACE_WITH_HELPER_TOKEN';
    const fixerToken = 'REPLACE_WITH_HELPER_TOKEN';
    const jobId = 'REPLACE_WITH_HELPER_JOB_ID';
    const fixerId = 'REPLACE_WITH_HELPER_FIXER_ID';

    // sending message without agreement should fail
    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ body: 'Hello' })
      .expect(403);

    // accept agreement
    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/agreement`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ accepted: true })
      .expect(201);

    // now message should pass
    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ body: 'Hello' })
      .expect(201);
  });

  test('negotiation propose -> lock -> accept both -> agreed', async () => {
    const clientToken = 'REPLACE_WITH_HELPER_TOKEN';
    const fixerToken = 'REPLACE_WITH_HELPER_TOKEN';
    const jobId = 'REPLACE_WITH_HELPER_JOB_ID';
    const fixerId = 'REPLACE_WITH_HELPER_FIXER_ID';

    // both accept agreement
    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/agreement`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ accepted: true });

    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/agreement`)
      .set('Authorization', `Bearer ${fixerToken}`)
      .send({ accepted: true });

    // propose
    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/negotiation/propose`)
      .set('Authorization', `Bearer ${fixerToken}`)
      .send({ proposedPriceMilliFec: 20000 })
      .expect(201);

    // lock
    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/negotiation/lock`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ lockedPriceMilliFec: 18000 })
      .expect(201);

    // client accepts
    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/negotiation/respond`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ accept: true })
      .expect(201);

    // fixer accepts -> agreed
    const res = await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/negotiation/respond`)
      .set('Authorization', `Bearer ${fixerToken}`)
      .send({ accept: true })
      .expect(201);

    expect(res.body.status).toBe('AGREED');
  });

  test('reject closes chat and blocks further messages', async () => {
    const clientToken = 'REPLACE_WITH_HELPER_TOKEN';
    const fixerToken = 'REPLACE_WITH_HELPER_TOKEN';
    const jobId = 'REPLACE_WITH_HELPER_JOB_ID';
    const fixerId = 'REPLACE_WITH_HELPER_FIXER_ID';

    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/agreement`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ accepted: true });

    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/agreement`)
      .set('Authorization', `Bearer ${fixerToken}`)
      .send({ accepted: true });

    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/negotiation/lock`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ lockedPriceMilliFec: 5000 });

    // fixer rejects
    const res = await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/negotiation/respond`)
      .set('Authorization', `Bearer ${fixerToken}`)
      .send({ accept: false })
      .expect(201);

    expect(res.body.status).toBe('REJECTED');

    // message should now fail (chat closed)
    await request(app.getHttpServer())
      .post(`/jobs/${jobId}/chats/${fixerId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ body: 'Still there?' })
      .expect(403);
  });
});
