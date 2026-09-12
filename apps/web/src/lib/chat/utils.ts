// Path: apps/web/src/lib/chat/utils.ts

import type { AxiosError } from "axios";

import {
  getUserFacingErrorMessage,
} from "@/lib/shared/user-facing-error";

export function renderAxiosError(
  err: unknown
): string {
  return getUserFacingErrorMessage(
    err,
    "We couldn't load this chat. Please try again.",
  );
}

/**
 * Returns the raw backend message for internal chat-state logic.
 *
 * This is intentionally NOT used for customer-facing error rendering.
 * It is still needed by chat bootstrap/state logic that checks specific
 * backend codes such as CONVERSATION_NOT_FOUND.
 */
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