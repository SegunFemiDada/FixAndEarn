// Path: apps/web/src/types/fixer.ts

export interface FixerVerification {
  selfieImagePath?: string | null;
  skills?: string | null;
  state?: string | null;
  city?: string | null;
  lga?: string | null;
  bio?: string | null;
}

export interface FixerAvailability {
  effective?: string | null;
}

export interface FixerItem {
  id: string;
  fullName: string;

  averageRating?: number | null;
  totalRatings?: number | null;

  fixerPreferredAvailability?: string | null;
  effectiveAvailability?: string | null;
  availabilityEffective?: string | null;
  fixerEffectiveAvailability?: string | null;

  availability?: FixerAvailability | null;

  verification?: FixerVerification | null;
}

export function buildImageSrc(path?: string | null) {
  if (!path) return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  if (!base) {
    return path;
  }

  return path.startsWith("/")
    ? `${base}${path}`
    : `${base}/${path}`;
}

export function availabilityLabel(
  value?: string | null
) {
  switch (value) {
    case "AVAILABLE":
      return "Available";

    case "BUSY":
      return "Busy";

    default:
      return "Unavailable";
  }
}

export function availabilityTone(
  value?: string | null
) {
  switch (value) {
    case "AVAILABLE":
      return "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";

    case "BUSY":
      return "border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";

    default:
      return "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300";
  }
}

export function ratingValue(
  value?: number | null
) {
  if (
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return "0.0";
  }

  return value.toFixed(1);
}

export function getEffectiveAvailability(
  fixer: Pick<
    FixerItem,
    | "availability"
    | "effectiveAvailability"
    | "fixerPreferredAvailability"
  >
) {
  return (
    fixer.availability?.effective ??
    fixer.effectiveAvailability ??
    fixer.fixerPreferredAvailability ??
    "UNAVAILABLE"
  );
}

export function extractErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
) {
  const e = error as {
    message?: string;
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  const apiMessage =
    e?.response?.data?.message;

  if (Array.isArray(apiMessage)) {
    return apiMessage.join(", ");
  }

  if (
    typeof apiMessage === "string" &&
    apiMessage.trim()
  ) {
    return apiMessage;
  }

  if (
    typeof e?.message === "string" &&
    e.message.trim()
  ) {
    return e.message;
  }

  return fallback;
}