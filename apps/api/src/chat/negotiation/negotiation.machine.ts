export type NegotiationState = {
  status: 'OPEN' | 'LOCKED' | 'AGREED' | 'REJECTED';
  proposedPriceMilliFec?: number | null;
  lockedPriceMilliFec?: number | null;
  lockedByUserId?: string | null;
  clientAcceptedAt?: Date | null;
  fixerAcceptedAt?: Date | null;
  agreedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectedByUserId?: string | null;
};

export function proposePrice(state: NegotiationState, proposedPriceMilliFec: number): NegotiationState {
  if (state.status === 'AGREED' || state.status === 'REJECTED') {
    throw new Error('NEGOTIATION_CLOSED');
  }
  if (state.status === 'LOCKED') {
    throw new Error('PRICE_ALREADY_LOCKED');
  }
  return { ...state, status: 'OPEN', proposedPriceMilliFec };
}

export function lockPrice(state: NegotiationState, lockedPriceMilliFec: number, lockedByUserId: string): NegotiationState {
  if (state.status === 'AGREED' || state.status === 'REJECTED') {
    throw new Error('NEGOTIATION_CLOSED');
  }
  return {
    ...state,
    status: 'LOCKED',
    lockedPriceMilliFec,
    lockedByUserId,
    clientAcceptedAt: null,
    fixerAcceptedAt: null,
  };
}

export function respondToLockedPrice(
  state: NegotiationState,
  actorRole: 'CLIENT' | 'FIXER',
  actorUserId: string,
  accept: boolean,
  now = new Date(),
): NegotiationState {
  // If it's not locked, you can't respond.
  if (state.status !== 'LOCKED') throw new Error('PRICE_NOT_LOCKED');

  // If rejected, close it immediately.
  if (!accept) {
    return { ...state, status: 'REJECTED', rejectedAt: now, rejectedByUserId: actorUserId };
  }

  const next: NegotiationState = { ...state };

  if (actorRole === 'CLIENT') next.clientAcceptedAt = now;
  if (actorRole === 'FIXER') next.fixerAcceptedAt = now;

  if (next.clientAcceptedAt && next.fixerAcceptedAt) {
    next.status = 'AGREED';
    next.agreedAt = now;
  }

  return next;
}
