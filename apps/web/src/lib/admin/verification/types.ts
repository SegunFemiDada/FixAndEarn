// Path: apps/web/src/lib/admin/verification/types.ts
export type VerificationDecisionAction = "APPROVE" | "REJECT" | "REQUEST_REUPLOAD";

export type VerificationReuploadField =
  | "ninImage"
  | "selfie"
  | "utilityBill"
  | "bio"
  | "skills"
  | "address"
  | "instagram"
  | "tiktok"
  | "bvn";

export type PendingVerificationRow = {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  state: string | null;
  city: string | null;
  lga: string | null;
  skills: string | null;
  user: {
    email: string;
    fullName: string;
    isActive: boolean;
  };
};

export type AdminVerificationUser = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminVerificationDetail = {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewReason: string | null;
  reuploadFields?: VerificationReuploadField[];

  ninHash: string;
  bvnHash: string;
  faceHash: string;

  ninImagePath: string | null;
  selfieImagePath: string | null;
  utilityBillPath: string | null;

  bio: string | null;
  skills: string | null;

  addressHouse: string | null;
  addressStreet: string | null;
  addressArea: string | null;
  nearestBusStop: string | null;
  lga: string | null;
  city: string | null;
  state: string | null;

  instagram: string | null;
  tiktok: string | null;

  user: AdminVerificationUser;
};

export type VerificationDecisionPayload = {
  action: VerificationDecisionAction;
  reason?: string;
  reuploadFields?: VerificationReuploadField[];
};

export type VerificationDecisionResponse = {
  ok: true;
  status: "PENDING" | "APPROVED" | "REJECTED";
};