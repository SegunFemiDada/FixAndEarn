export type DiscoverFixerItem = {
  id: string;
  fullName: string;
  averageRating: number;
  totalRatings: number;

  fixerPreferredAvailability: "UNAVAILABLE" | "AVAILABLE";
  fixerAvailabilityUpdatedAt?: string | null;

  effectiveAvailability?: "UNAVAILABLE" | "BUSY" | "AVAILABLE";

  availability?: {
    preferred: "UNAVAILABLE" | "AVAILABLE";
    effective: "UNAVAILABLE" | "BUSY" | "AVAILABLE";
    updatedAt?: string | null;
  } | null;

  verification: {
    bio?: string | null;
    skills?: string | null;
    state?: string | null;
    city?: string | null;
    lga?: string | null;
    selfieImagePath?: string | null;
    status?: string | null;
  } | null;
};

export type DiscoverFixersParams = {
  skill?: string;
  state?: string;
  city?: string;
  minRating?: number;
  skip?: number;
  take?: number;
};