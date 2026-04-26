import { getToken } from "@/lib/auth/session";

export type FixerAvailabilityPreferred = "AVAILABLE" | "UNAVAILABLE";
export type FixerAvailabilityEffective = "AVAILABLE" | "UNAVAILABLE" | "BUSY";

export type FixerAvailabilityResponse = {
  preferred: FixerAvailabilityPreferred;
  effective: FixerAvailabilityEffective;
  updatedAt: string | null;
};

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchMyAvailability(): Promise<FixerAvailabilityResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fixers/me/availability`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch availability (${res.status})`);
  }

  return res.json();
}

export async function setMyAvailability(status: FixerAvailabilityPreferred): Promise<FixerAvailabilityResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fixers/me/availability`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to set availability (${res.status})`);
  }

  return res.json();
}