//path: apps/api/src/chat/negotiation/negotiation.machine.spec.ts
import { lockPrice, proposePrice, respondToLockedPrice } from './negotiation.machine';

describe('Negotiation machine', () => {
  test('propose -> lock -> accept both -> agreed', () => {
    const s1 = proposePrice({ status: 'OPEN' }, 5000);
    expect(s1.proposedPriceMilliFec).toBe(5000);

    const s2 = lockPrice(s1, 6000, 'userA');
    expect(s2.status).toBe('LOCKED');
    expect(s2.lockedPriceMilliFec).toBe(6000);

    const s3 = respondToLockedPrice(s2, 'CLIENT', 'client1', true, new Date('2026-01-01T00:00:00Z'));
    expect(s3.status).toBe('LOCKED');
    expect(s3.clientAcceptedAt).toBeTruthy();

    const s4 = respondToLockedPrice(s3, 'FIXER', 'fixer1', true, new Date('2026-01-01T00:01:00Z'));
    expect(s4.status).toBe('AGREED');
    expect(s4.agreedAt).toBeTruthy();
  });

  test('reject locked price closes negotiation', () => {
    const s1 = lockPrice({ status: 'OPEN' }, 7000, 'userA');
    const s2 = respondToLockedPrice(s1, 'FIXER', 'fixer1', false, new Date('2026-01-01T00:00:00Z'));
    expect(s2.status).toBe('REJECTED');
    expect(s2.rejectedByUserId).toBe('fixer1');
  });
});
