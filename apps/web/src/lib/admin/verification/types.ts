// Path: apps/web/src/lib/admin/verification/types.ts

export type VerificationDecisionAction =
  | "APPROVE"
  | "REJECT"
  | "REQUEST_REUPLOAD";

export type VerificationReuploadField =
  | "ninImage"
  | "selfie"
  | "utilityBill"
  | "bio"
  | "skills"
  | "address";

export type NinVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "FAILED";

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
  ninVerificationStatus: NinVerificationStatus;
  ninVerifiedAt: string | null;
  ninVerifiedByAdminId: string | null;
  ninVerificationNote: string | null;
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
  faceHash: string;

  ninVerificationStatus: NinVerificationStatus;
  ninVerifiedAt: string | null;
  ninVerifiedByAdminId: string | null;
  ninVerificationNote: string | null;

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

export type NinVerificationDecisionAction =
  | "VERIFY"
  | "FAIL";

export type NinVerificationDecisionPayload = {
  action: NinVerificationDecisionAction;
  note: string;
};

export type NinVerificationDecisionResponse = {
  ok: true;
  status: NinVerificationStatus;
};