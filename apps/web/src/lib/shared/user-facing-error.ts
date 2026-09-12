// Path: apps/web/src/lib/shared/user-facing-error.ts

type ErrorPayload = {
  message?: unknown;
  error?: unknown;
  code?: unknown;
};

const MACHINE_ERROR_MESSAGES: Record<string, string> = {
  // Authentication / account
  ACCOUNT_SUSPENDED:
    "Your account has been suspended. Please contact FixAndEarn support for assistance.",
  SESSION_EXPIRED:
    "Your session has expired. Please log in again.",
  SESSION_REVOKED:
    "Your session is no longer valid. Please log in again.",
  INVALID_CREDENTIALS:
    "The email or password you entered is incorrect.",
  EMAIL_NOT_VERIFIED:
    "Please verify your email address before continuing.",
  USER_NOT_FOUND:
    "We couldn't find that account.",
  INVALID_EMAIL:
    "Please enter a valid email address.",
  PASSWORD_TOO_SHORT:
    "Please choose a longer password.",
  INVALID_RESET_TOKEN:
    "This password reset link is invalid. Please request a new one.",
  RESET_TOKEN_EXPIRED:
    "This password reset link has expired. Please request a new one.",

  // Phone verification
  ALREADY_VERIFIED:
    "This verification step has already been completed.",
  NO_CODE_SENT:
    "No verification code has been sent yet. Please request a new code.",
  INVALID_CODE:
    "That verification code is not valid. Please check it and try again.",
  CODE_EXPIRED:
    "That verification code has expired. Please request a new one.",

  // Jobs / hiring
  FIXER_ID_REQUIRED_FOR_URGENT_HIRE:
    "Please select a fixer before starting the urgent hire.",
  YOU_CANNOT_HIRE_YOURSELF:
    "You cannot hire yourself for a job.",
  SKILL_CATEGORY_REQUIRED:
    "Please select a skill category.",
  STATE_REQUIRED:
    "Please select a state.",
  CITY_REQUIRED:
    "Please enter a city or town.",
  FIXER_NOT_FOUND_OR_NOT_VERIFIED:
    "That fixer is no longer available for hire.",
  ONLY_JOB_OWNER:
    "Only the job owner can perform this action.",
  JOB_HAS_NO_LOCKED_PRICE:
    "This job does not have an agreed price yet.",
  LOCKED_PRICE_NOT_FOUND:
    "The agreed job price could not be found.",
  PRICE_NOT_AGREED:
    "The job price has not been agreed yet.",
  LOCKED_PRICE_MISSING:
    "The agreed job price is missing.",
  NO_AGREED_FIXER_FOR_JOB:
    "No agreed fixer is currently linked to this job.",

  // Payments / wallet
  INVALID_AMOUNT:
    "Please enter a valid amount.",
  WITHDRAWAL_NOT_FOUND:
    "We couldn't find that withdrawal request.",
  BANK_DETAILS_INCOMPLETE:
    "Please complete your bank details before continuing.",

  // Admin
  INVALID_REFRESH_TOKEN:
    "Your admin session is no longer valid. Please sign in again.",
  ADMIN_SESSION_EXPIRED:
    "Your admin session has expired. Please sign in again.",
  REFRESH_TOKEN_EXPIRED:
    "Your admin session has expired. Please sign in again.",
  ADMIN_ALREADY_EXISTS:
    "An administrator with that email already exists.",
};

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400:
    "The request could not be completed. Please check the information and try again.",
  401:
    "Your session is no longer valid. Please sign in again.",
  403:
    "You do not have permission to perform this action.",
  404:
    "The requested item could not be found.",
  409:
    "This action could not be completed because the current state has changed.",
  422:
    "Some of the information provided is invalid. Please review it and try again.",
  429:
    "Too many requests. Please wait a moment and try again.",
  500:
    "Something went wrong on our side. Please try again.",
  502:
    "The service is temporarily unavailable. Please try again.",
  503:
    "The service is temporarily unavailable. Please try again.",
  504:
    "The service took too long to respond. Please try again.",
};

/**
 * NestJS / HTTP framework messages that should never be shown
 * directly to a customer when a proper status-based message exists.
 */
const GENERIC_HTTP_MESSAGES = new Set([
  "Bad Request",
  "Unauthorized",
  "Forbidden",
  "Not Found",
  "Method Not Allowed",
  "Not Acceptable",
  "Request Timeout",
  "Conflict",
  "Gone",
  "Length Required",
  "Precondition Failed",
  "Payload Too Large",
  "Unsupported Media Type",
  "Unprocessable Entity",
  "Too Many Requests",
  "Internal Server Error",
  "Not Implemented",
  "Bad Gateway",
  "Service Unavailable",
  "Gateway Timeout",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMachineErrorCode(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) return false;

  return /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(normalized);
}

function isGenericHttpMessage(value: string): boolean {
  return GENERIC_HTTP_MESSAGES.has(value.trim());
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  return trimmed;
}

function normalizeCandidate(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeCandidate(item));
  }

  const stringValue = cleanString(value);

  if (!stringValue) return [];

  const mapped = MACHINE_ERROR_MESSAGES[stringValue];

  if (mapped) {
    return [mapped];
  }

  /*
   * Unknown backend machine-readable codes should never be
   * exposed directly to the customer.
   */
  if (isMachineErrorCode(stringValue)) {
    return [];
  }

  /*
   * Generic NestJS / HTTP exception names should not bypass
   * the HTTP status mapping below.
   */
  if (isGenericHttpMessage(stringValue)) {
    return [];
  }

  /*
   * Axios technical errors are not useful to customers.
   */
  if (/^Request failed with status code \d+$/i.test(stringValue)) {
    return [];
  }

  if (
    stringValue === "Network Error" ||
    stringValue === "ERR_NETWORK" ||
    stringValue === "ECONNABORTED"
  ) {
    return [];
  }

  return [stringValue];
}

function getStatus(error: unknown): number | null {
  if (!isRecord(error)) return null;

  const response = error.response;

  if (!isRecord(response)) return null;

  return typeof response.status === "number"
    ? response.status
    : null;
}

function getResponsePayload(error: unknown): ErrorPayload | null {
  if (!isRecord(error)) return null;

  const response = error.response;

  if (!isRecord(response)) return null;

  const data = response.data;

  if (!isRecord(data)) return null;

  return {
    message: data.message,
    error: data.error,
    code: data.code,
  };
}

function getNetworkFailure(error: unknown): boolean {
  if (!isRecord(error)) return false;

  const response = error.response;
  const request = error.request;

  return !response && Boolean(request);
}

export function getUserFacingErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const payload = getResponsePayload(error);
  const status = getStatus(error);

  /*
   * IMPORTANT:
   * Known machine-readable backend codes always take priority.
   *
   * Example:
   * 400 + INVALID_AMOUNT
   *
   * should display the specific INVALID_AMOUNT message rather
   * than the generic 400 message.
   */
  const candidates = [
    ...normalizeCandidate(payload?.message),
    ...normalizeCandidate(payload?.error),
    ...normalizeCandidate(payload?.code),
  ];

  const uniqueCandidates = Array.from(
    new Set(candidates),
  );

  if (uniqueCandidates.length > 0) {
    return uniqueCandidates.join(" ");
  }

  /*
   * Generic HTTP/NestJS messages are handled here by status.
   *
   * Examples:
   * "Forbidden" -> 403 friendly message
   * "Bad Request" -> 400 friendly message
   * "Not Found" -> 404 friendly message
   * "Conflict" -> 409 friendly message
   */
  if (status !== null && HTTP_ERROR_MESSAGES[status]) {
    return HTTP_ERROR_MESSAGES[status];
  }

  /*
   * Network failure.
   */
  if (getNetworkFailure(error)) {
    return (
      "We couldn't reach FixAndEarn. Please check your internet connection and try again."
    );
  }

  /*
   * Last safe fallback:
   * preserve a genuinely useful human-readable message,
   * but never expose machine codes or generic technical
   * Axios/framework messages.
   */
  if (isRecord(error)) {
    const rawMessage = cleanString(error.message);

    if (
      rawMessage &&
      !isMachineErrorCode(rawMessage) &&
      !isGenericHttpMessage(rawMessage) &&
      !/^Request failed with status code \d+$/i.test(rawMessage) &&
      rawMessage !== "Network Error" &&
      rawMessage !== "ERR_NETWORK" &&
      rawMessage !== "ECONNABORTED"
    ) {
      return rawMessage;
    }
  }

  return fallback;
}