// Path: apps/web/src/lib/chat/utils.ts

import type { AxiosError } from "axios";

export function renderAxiosError(
  err: unknown
): string {
  const e =
    err as AxiosError<{
      message?:
        | string
        | string[];
    }>;

  const msg =
    e.response?.data
      ?.message;

  if (
    Array.isArray(msg)
  ) {
    return msg.join(", ");
  }

  if (msg) {
    return String(msg);
  }

  if (e.message) {
    return e.message;
  }

  return "Unknown error";
}

export function getBackendMessage(
  err: unknown
): string | null {
  const e =
    err as AxiosError<{
      message?:
        | string
        | string[];
    }>;

  const msg =
    e.response?.data
      ?.message;

  if (!msg) {
    return null;
  }

  if (
    Array.isArray(msg)
  ) {
    return msg.join(", ");
  }

  return String(msg);
}
export function getConversationBootstrapState(
  backendMsg?: string | null
) {
  const isConversationMissing =
    backendMsg ===
      "CONVERSATION_NOT_FOUND" ||
    Boolean(
      backendMsg?.includes(
        "CONVERSATION_NOT_FOUND"
      )
    );

  const needsAgreement =
    backendMsg ===
    "CHAT_AGREEMENT_REQUIRED";

  return {
    isConversationMissing,
    needsAgreement,
    showAgreementBootstrap:
      isConversationMissing ||
      needsAgreement,
  };
}
export function milliToFecInput(
  milli?: number | null
) {
  if (
    typeof milli !==
    "number"
  ) {
    return "";
  }

  return (
    milli / 1000
  ).toFixed(2);
}