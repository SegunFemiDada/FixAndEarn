// Path: apps/api/src/chat/negotiation/negotiation.machine.ts

export type NegotiationStatus =
  | "OPEN"
  | "LOCKED"
  | "AGREED"
  | "REJECTED";

export type NegotiationState = {
  status: NegotiationStatus;

  proposedPriceMilliFec?: number | null;

  lockedPriceMilliFec?: number | null;
  lockedByUserId?: string | null;

  clientAcceptedAt?: Date | null;
  fixerAcceptedAt?: Date | null;

  agreedAt?: Date | null;

  rejectedAt?: Date | null;
  rejectedByUserId?: string | null;
};

export function proposePrice(
  state: NegotiationState,
  proposedPriceMilliFec: number
): NegotiationState {
  if (state.status === "AGREED") {
    throw new Error("NEGOTIATION_ALREADY_AGREED");
  }

  if (state.status === "LOCKED") {
    throw new Error("PRICE_ALREADY_LOCKED");
  }

  if (state.status === "REJECTED") {
    throw new Error("NEGOTIATION_REJECTED");
  }

  return {
    ...state,
    status: "OPEN",
    proposedPriceMilliFec,
  };
}

export function lockPrice(
  state: NegotiationState,
  lockedPriceMilliFec: number,
  lockedByUserId: string,
  lockedByRole: "CLIENT" | "FIXER",
  now = new Date()
): NegotiationState {
  if (state.status === "AGREED") {
    throw new Error("NEGOTIATION_ALREADY_AGREED");
  }

  if (state.status === "REJECTED") {
    throw new Error("NEGOTIATION_REJECTED");
  }

  const next: NegotiationState = {
    ...state,
    status: "LOCKED",
    lockedPriceMilliFec,
    lockedByUserId,
    clientAcceptedAt: null,
    fixerAcceptedAt: null,
  };

  // Whoever locks price auto-accepts
  if (lockedByRole === "CLIENT") {
    next.clientAcceptedAt = now;
  }

  if (lockedByRole === "FIXER") {
    next.fixerAcceptedAt = now;
  }

  return next;
}

export function respondToLockedPrice(
  state: NegotiationState,
  actorRole: "CLIENT" | "FIXER",
  actorUserId: string,
  accept: boolean,
  now = new Date()
): NegotiationState {
  if (state.status !== "LOCKED") {
    throw new Error("PRICE_NOT_LOCKED");
  }

if (!accept) {
  return {
    ...state,
    status: "REJECTED",

    lockedPriceMilliFec: null,
    lockedByUserId: null,

    clientAcceptedAt: null,
    fixerAcceptedAt: null,

    rejectedAt: now,
    rejectedByUserId: actorUserId,
  };
}

  const next: NegotiationState = {
    ...state,
  };

  if (actorRole === "CLIENT") {
    if (!next.clientAcceptedAt) {
      next.clientAcceptedAt = now;
    }
  }

  if (actorRole === "FIXER") {
    if (!next.fixerAcceptedAt) {
      next.fixerAcceptedAt = now;
    }
  }

  if (next.clientAcceptedAt && next.fixerAcceptedAt) {
    next.status = "AGREED";
    next.agreedAt = now;
  }

  return next;
}