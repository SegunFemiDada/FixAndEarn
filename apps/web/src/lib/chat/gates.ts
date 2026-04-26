// Path: apps/web/src/lib/chat/gates.ts

export type AgreementDecision = "ACCEPTED" | "DECLINED" | "PENDING" | "UNKNOWN";

export function normalizeAgreementStatus(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") return raw.trim() ? raw.trim() : null;
  if (typeof raw === "boolean") return raw ? "ACCEPTED" : "DECLINED";
  return null;
}

export function pickAgreementStatusFromConversation(data: any): string | null {
  if (!data) return null;

  const candidates = [
    data.agreementStatus,
    data.agreement?.status,
    data.conversation?.agreementStatus,
    data.conversation?.agreement?.status,
    data.agreementAccepted,
    data.conversation?.agreementAccepted,
  ];

  for (const c of candidates) {
    const s = normalizeAgreementStatus(c);
    if (s) return s;
  }
  return null;
}

export function decideAgreement(status: string | null): AgreementDecision {
  if (!status) return "UNKNOWN";
  const s = status.toUpperCase();

  // Common “pending” variants
  if (s === "PENDING" || s === "WAITING" || s === "AWAITING") return "PENDING";

  // Common “declined” variants
  if (
    s === "DECLINED" ||
    s === "REJECTED" ||
    s === "DENIED" ||
    s === "NOT_ACCEPTED" ||
    s === "NOTACCEPTED"
  ) {
    return "DECLINED";
  }

  // Common “accepted” variants
  if (s === "ACCEPTED" || s === "AGREED" || s === "APPROVED") return "ACCEPTED";

  // Unknown wording from backend -> keep locked until we see real response
  return "UNKNOWN";
}

export function agreementAllowsChatActions(status: string | null): boolean {
  return decideAgreement(status) === "ACCEPTED";
}
