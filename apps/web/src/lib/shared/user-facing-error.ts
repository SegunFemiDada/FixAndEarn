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
  400: "The request could not be completed. Please check the information and try again.",
  401: "Your session is no longer valid. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested item could not be found.",
  409: "This action could not be completed because the current state has changed.",
  422: "Some of the information provided is invalid. Please review it and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again.",
  502: "The service is temporarily unavailable. Please try again.",
  503: "The service is temporarily unavailable. Please try again.",
  504: "The service took too long to respond. Please try again.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMachineErrorCode(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) return false;

  return /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(normalized);
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  return trimmed;
}

function normalizeCandidate(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeCandidate(item))
      .filter(Boolean);
  }

  const stringValue = cleanString(value);

  if (!stringValue) return [];

  const mapped = MACHINE_ERROR_MESSAGES[stringValue];

  if (mapped) {
    return [mapped];
  }

  // Never expose an unknown machine-readable backend code.
  if (isMachineErrorCode(stringValue)) {
    return [];
  }

  // Axios' generic technical message is not useful to customers.
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

  return typeof response.status === "number" ? response.status : null;
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

  const candidates = [
    ...(normalizeCandidate(payload?.message) ?? []),
    ...(normalizeCandidate(payload?.error) ?? []),
    ...(normalizeCandidate(payload?.code) ?? []),
  ];

  const uniqueCandidates = Array.from(new Set(candidates));

  if (uniqueCandidates.length > 0) {
    return uniqueCandidates.join(" ");
  }

  const status = getStatus(error);

  if (status !== null && HTTP_ERROR_MESSAGES[status]) {
    return HTTP_ERROR_MESSAGES[status];
  }

  if (getNetworkFailure(error)) {
    return "We couldn't reach FixAndEarn. Please check your internet connection and try again.";
  }

  if (isRecord(error)) {
    const rawMessage = cleanString(error.message);

    if (
      rawMessage &&
      !isMachineErrorCode(rawMessage) &&
      !/^Request failed with status code \d+$/i.test(rawMessage)
    ) {
      return rawMessage;
    }
  }

  return fallback;
}