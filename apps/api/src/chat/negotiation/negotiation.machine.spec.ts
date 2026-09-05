import {
  lockPrice,
  proposePrice,
  respondToLockedPrice,
} from "./negotiation.machine";

describe("Negotiation machine", () => {
  test("propose -> lock -> accept both -> agreed", () => {
    const s1 = proposePrice({ status: "OPEN" }, 5000);

    expect(s1.proposedPriceMilliFec).toBe(5000);

    const s2 = lockPrice(
      s1,
      6000,
      "userA",
      "CLIENT",
      new Date("2026-01-01T00:00:00Z"),
    );

    expect(s2.status).toBe("LOCKED");
    expect(s2.lockedPriceMilliFec).toBe(6000);
    expect(s2.lockedByUserId).toBe("userA");
    expect(s2.clientAcceptedAt).toEqual(
      new Date("2026-01-01T00:00:00Z"),
    );

    const s3 = respondToLockedPrice(
      s2,
      "FIXER",
      "fixer1",
      true,
      new Date("2026-01-01T00:01:00Z"),
    );

    expect(s3.status).toBe("AGREED");
    expect(s3.fixerAcceptedAt).toBeTruthy();
    expect(s3.agreedAt).toEqual(
      new Date("2026-01-01T00:01:00Z"),
    );
  });

  test("reject locked price moves negotiation to REJECTED", () => {
    const s1 = lockPrice(
      { status: "OPEN" },
      7000,
      "userA",
      "CLIENT",
      new Date("2026-01-01T00:00:00Z"),
    );

    const s2 = respondToLockedPrice(
      s1,
      "FIXER",
      "fixer1",
      false,
      new Date("2026-01-01T00:00:00Z"),
    );

    expect(s2.status).toBe("REJECTED");
    expect(s2.rejectedByUserId).toBe("fixer1");
    expect(s2.rejectedAt).toEqual(
      new Date("2026-01-01T00:00:00Z"),
    );
    expect(s2.lockedPriceMilliFec).toBeNull();
    expect(s2.lockedByUserId).toBeNull();
  });
});