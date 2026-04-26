// Path: apps/web/src/app/app/verification/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  VerificationSubmitFormSchema,
  type VerificationSubmitFormValues,
} from "@/lib/verification/types";
import { useMyVerification, useSubmitVerification } from "@/lib/verification/queries";
import { getToken, getActiveRole, getStoredRoles, type Role } from "@/lib/auth/session";

type ReuploadField =
  | "ninImage"
  | "selfie"
  | "utilityBill"
  | "bio"
  | "skills"
  | "address"
  | "instagram"
  | "tiktok"
  | "bvn";

const REUPLOAD_LABELS: Record<ReuploadField, string> = {
  ninImage: "NIN image",
  selfie: "Selfie image",
  utilityBill: "Utility bill",
  bio: "Bio",
  skills: "Skills",
  address: "Address",
  instagram: "Instagram",
  tiktok: "TikTok",
  bvn: "BVN",
};
const SKILLS_LIST = [
  "Bricklayer", "Block Layer", "Concreter", "Woodworker", "Carpenter", "Cook", "Messenger",
  "Plumber", "Pipe Fitter", "Painter", "Decorator", "Interior Designer", "Tiler", 
  "Cladder", "Welder", "Fabricator", "Mason", "POP Plasterer", "Roofer", "Tailor", 
  "Scaffolder", "Aluminium Fabricator", "Iron Worker", "Steel Fixer", 
  "Automobile Mechanic", "Auto-electrician", "Motorcycle Mechanic", "Tricycle Repairer",
  "Autobody Repairer", "Generator Mechanic", "Vulcanizer", "Tire Repairer", 
  "CNG Conversion Technician", "Spray Painter", "Panel Beater", "Hairdresser", 
  "Stylist", "Barber", "Beauty Therapist", "Cosmetologist", "Makeup Artist", 
  "Wig Maker", "Braider", "Weaver", "Nail Technician", "Computer Repairer", "Caregiver", 
  "Childcare Provider", "Elderly Caregiver", "Housekeeper", "Cleaner",
  "GSM Repairer", "Network Technician", "System Security Technician", "Satellite TV Installer",
  "Graphic Designer", "Social Media Content Creator", "Social Media Manager", 
  "Creative Media Producer", "Photographer", "Videographer", "Coder", "Web Developer",
  "Caterer", "Chef", "Baker", "Event Planner", "Event Decorator", "Bartender", 
  "Chapman Maker", "Livestock Farmer", "Poultry Farmer", "Fish Farmer", "Crop Farmer",
  "Agribusiness Operator", "Snail Farmer", "Rabbit Farmer", "Post-Harvest Processor",
  "Fashion Designer", "Garment Maker", "Leather Worker", "Shoemaker", "Bag Maker",
  "Furniture Maker", "Upholsterer", "Bead Maker", "Jewellery Designer", "Soap Maker",
  "Perfumer", "Cosmetics Producer", "Printmaker", "Textile Dyer", "Tie & Dye Artisan",
  "Potter", "Electrician", "Refrigeration Technician", "Air-Conditioning Technician",
  "Solar PV Installer", "Mechanised Agriculture Technician", "Electronics Technician",
  "Driver", "Logistics Personnel", "CCTV Installer", "General Multipurpose"
];

function backendMessage(err: unknown): string | null {
  const e: any = err;
  const msg = e?.response?.data?.message;
  if (!msg) return null;
  if (Array.isArray(msg)) return msg.join(", ");
  return String(msg);
}

function errorText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "message" in (value as any)) {
    const msg = (value as any).message;
    return typeof msg === "string" ? msg : String(msg);
  }
  return String(value);
}

function VerifiedBadge({ role }: { role: Role | null }) {
  if (role === "FIXER") {
    return (
      <span className="inline-flex items-center rounded-full border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-[#2E7D32] dark:text-green-200">
        Verified
      </span>
    );
  }

  if (role === "CLIENT") {
    return (
      <span className="inline-flex items-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-[#5B8FCC] dark:text-[#7AAEE0]">
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-2 py-0.5 text-xs font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
      Verified
    </span>
  );
}

function humanizeReuploadFields(fields: string[]) {
  return fields
    .map((field) => REUPLOAD_LABELS[field as ReuploadField] ?? field)
    .filter(Boolean);
}

function parseReviewReason(raw: string | null | undefined) {
  const text = String(raw ?? "").trim();
  if (!text) {
    return {
      isReuploadRequest: false,
      cleanReason: null as string | null,
    };
  }

  const prefix = "REQUEST_REUPLOAD:";
  if (!text.startsWith(prefix)) {
    return {
      isReuploadRequest: false,
      cleanReason: text,
    };
  }

  const body = text.slice(prefix.length).trim();
  const [reasonPart] = body.split("| FIELDS:");
  const cleanReason = reasonPart?.trim() || null;

  return {
    isReuploadRequest: true,
    cleanReason,
  };
}

export default function VerificationPage() {
  const verification = useMyVerification();
  const submitMutation = useSubmitVerification();
  const { data, isLoading, isError, error } = verification;

  const [skillInput, setSkillInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const token = useMemo(() => getToken(), []);
  const isAuthed = !!token;

  const roles = useMemo(() => getStoredRoles(), []);
  const activeRole = useMemo(() => getActiveRole(), []);

  const roleForUi: Role | null = useMemo(() => {
    if (activeRole) return activeRole;
    if (roles.length === 1) return roles[0];
    return null;
  }, [activeRole, roles]);

  const isClient = roleForUi === "CLIENT";
  const isFixer = roleForUi === "FIXER";

  const status = (data as any)?.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
  const reviewReason = (data as any)?.reviewReason ?? null;
  const reuploadFields = (((data as any)?.reuploadFields ?? []) as string[]).filter(Boolean);
  const reuploadLabels = humanizeReuploadFields(reuploadFields);

  const parsedReason = parseReviewReason(reviewReason);
  const isRejected = status === "REJECTED";
  const hasTargetedReupload = isRejected && reuploadFields.length > 0;
  const isReuploadRequest = isRejected && hasTargetedReupload && parsedReason.isReuploadRequest;
  const canSubmit = isAuthed && (!status || isRejected);

  const needsFile = (field: "ninImage" | "selfie" | "utilityBill") =>
    !hasTargetedReupload || reuploadFields.includes(field);

  const needsText = (field: "bio" | "skills" | "address" | "instagram" | "tiktok" | "bvn") =>
    !hasTargetedReupload || reuploadFields.includes(field);

  const showOnlyTargetedFields = hasTargetedReupload;

  const form = useForm<VerificationSubmitFormValues>({
    resolver: zodResolver(VerificationSubmitFormSchema),
    defaultValues: {
      bvn: "",
      bio: "",
      skills: [],
      addressHouse: "",
      addressStreet: "",
      addressArea: "",
      nearestBusStop: "",
      lga: "",
      city: "",
      state: "",
      instagram: "",
      tiktok: "",
      ninImage: undefined,
      selfieImage: undefined,
      utilityBill: undefined,
    },
    mode: "onChange",
  });

  const skills = form.watch("skills");
  useEffect(() => {
    const submitted = (data as any)?.submittedData;
    if (!submitted) return;

    form.reset({
      bvn: "",
      bio: submitted.bio ?? "",
      skills:
        Array.isArray(submitted.skills) && submitted.skills.length > 0
          ? submitted.skills
          : isClient
            ? ["CLIENT"]
            : [],
      addressHouse: submitted.addressHouse ?? "",
      addressStreet: submitted.addressStreet ?? "",
      addressArea: submitted.addressArea ?? "",
      nearestBusStop: submitted.nearestBusStop ?? "",
      lga: submitted.lga ?? "",
      city: submitted.city ?? "",
      state: submitted.state ?? "",
      instagram: submitted.instagram ?? "",
      tiktok: submitted.tiktok ?? "",
      ninImage: undefined,
      selfieImage: undefined,
      utilityBill: undefined,
    });
  }, [data, form, isClient]);
  useEffect(() => {
    if (!isClient) return;
    const current = form.getValues("skills") || [];
    if (current.length === 0) {
      form.setValue("skills", ["CLIENT"], { shouldValidate: false });
    }
  }, [isClient, form]);

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;

    const exists = (skills || []).some((x) => x.toLowerCase() === s.toLowerCase());
    if (exists) return;

    form.setValue("skills", [...(skills || []), s], { shouldValidate: false });
    setSkillInput("");
  }

  function removeSkill(s: string) {
    form.setValue(
      "skills",
      (skills || []).filter((x) => x !== s),
      { shouldValidate: false }
    );
  }

  function setFieldError(name: keyof VerificationSubmitFormValues, message: string) {
    form.setError(name, { type: "manual", message });
  }

  function clearVisibleErrors() {
    setLocalError(null);
    form.clearErrors();
  }

  function validateVisibleFields(values: VerificationSubmitFormValues): boolean {
    let ok = true;

    if (needsText("bvn")) {
      if (!values.bvn?.trim()) {
        setFieldError("bvn", "BVN is required");
        ok = false;
      } else if (values.bvn.trim().length < 6) {
        setFieldError("bvn", "BVN must be at least 6 characters");
        ok = false;
      }
    }

    if (needsText("bio")) {
      if (!values.bio?.trim()) {
        setFieldError("bio", "Bio is required");
        ok = false;
      } else if (values.bio.trim().length < 10) {
        setFieldError("bio", "Bio must be at least 10 characters");
        ok = false;
      }
    }

    if (needsText("skills") && isFixer) {
      if (!values.skills || values.skills.length === 0) {
        setFieldError("skills", "At least one skill is required");
        ok = false;
      }
    }

    if (needsText("address")) {
      const addressChecks: Array<[keyof VerificationSubmitFormValues, string]> = [
        ["addressHouse", "House number is required"],
        ["addressStreet", "Street name is required"],
        ["addressArea", "Area is required"],
        ["nearestBusStop", "Nearest bus stop is required"],
        ["lga", "LGA is required"],
        ["city", "City/Town is required"],
        ["state", "State is required"],
      ];

      for (const [key, message] of addressChecks) {
        const value = values[key];
        if (typeof value !== "string" || !value.trim()) {
          setFieldError(key, message);
          ok = false;
        }
      }
    }

    if (needsFile("ninImage") && !values.ninImage) {
      setFieldError("ninImage", "NIN image is required");
      ok = false;
    }

    if (needsFile("selfie") && !values.selfieImage) {
      setFieldError("selfieImage", "Selfie image is required");
      ok = false;
    }

    if (needsFile("utilityBill") && !values.utilityBill) {
      setFieldError("utilityBill", "Utility bill is required");
      ok = false;
    }

    return ok;
  }

  async function onSubmit(values: VerificationSubmitFormValues) {
    clearVisibleErrors();

    const valid = validateVisibleFields(values);
    if (!valid) {
      setLocalError("Fill the required field(s) before submitting.");
      return;
    }

    await submitMutation.mutateAsync(values);
    await verification.refetch();
  }

  // Helper to render the correct status card
  function renderStatusCard() {
    if (!status) return null;

    switch (status) {
      case "PENDING":
        return (
          <div className="rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm font-semibold text-[#2E7D32] dark:text-green-200">
              Review in progress
            </div>
            <p className="mt-2 text-sm text-[#2E7D32] dark:text-green-200">
              Your verification documents have been submitted successfully.
              The review process may take up to 24 hours. You will be notified once a decision is made.
            </p>
            <div className="mt-4">
              <Link
                href="/app/jobs"
                className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
              >
                Browse jobs
              </Link>
            </div>
          </div>
        );

      case "APPROVED":
        return (
          <div className="rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#2E7D32] dark:text-green-200">
                  Verification approved
                </div>
                <p className="mt-2 text-sm text-[#2E7D32] dark:text-green-200">
                  Your account is verified. Core features are now unlocked.
                </p>
              </div>
              <VerifiedBadge role={roleForUi} />
            </div>
            <div className="mt-4">
              <Link
                href="/app/jobs"
                className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
              >
                Go to jobs
              </Link>
            </div>
          </div>
        );

      case "REJECTED":
        if (isReuploadRequest) {
          return (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                <p className="font-semibold">Reupload requested</p>
                <p className="mt-1">
                  {parsedReason.cleanReason ?? "Please correct the selected item(s) and resubmit."}
                </p>
              </div>

              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                Reupload required for: <span className="font-semibold">{reuploadLabels.join(", ")}</span>
              </div>

              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 p-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                Your previous submission details have been retained. Only the requested field(s) below need correction and resubmission.
              </div>

              {reuploadFields.includes("bvn") && (
                <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  For security reasons, BVN is never returned to the browser and cannot be prefilled. Enter it again only if BVN correction was requested.
                </div>
              )}

              {(reuploadFields.includes("ninImage") ||
                reuploadFields.includes("selfie") ||
                reuploadFields.includes("utilityBill")) && (
                <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  File upload inputs always appear empty in the browser for security reasons. That does not mean previously uploaded files were lost.
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                <p className="font-semibold">Verification rejected</p>
                <p className="mt-1">
                  {parsedReason.cleanReason ?? "Your submission was rejected. Review the issue and submit a corrected verification."}
                </p>
              </div>

              <div className="rounded-xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                Your previous submission was rejected. You can correct and resubmit below. Previously submitted data may be reused where applicable.
              </div>
            </div>
          );
        }

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Account Verification</h1>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Submit your documents. Approval is required before core features.
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          {!isAuthed ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Not authenticated.</p>
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Go to <Link className="underline text-[#5B8FCC] dark:text-[#7AAEE0]" href="/login">/login</Link> and sign in.
              </p>
            </div>
          ) : isLoading && !data ? (
            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading status…</p>
          ) : isError ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Unable to load status.</p>
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                {backendMessage(error) ?? "Unable to load verification status."}
              </p>
            </div>
          ) : status ? (
            renderStatusCard()
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Not submitted yet</p>
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Complete the form below to submit your verification.
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        {(!status || status === "REJECTED") && (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <h2 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {isReuploadRequest
                ? "Correct and resubmit requested field(s)"
                : isRejected
                  ? "Resubmit verification"
                  : "Submit verification"}
            </h2>

            {showOnlyTargetedFields && (
              <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Only the requested field(s) are shown below.
              </p>
            )}

            <form className="mt-4 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              {needsText("bvn") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">BVN</label>
                  <input
                    className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                    {...form.register("bvn")}
                  />
                  {errorText(form.formState.errors.bvn?.message) && (
                    <p className="text-sm text-[#D9534F] dark:text-red-300">{errorText(form.formState.errors.bvn?.message)}</p>
                  )}
                </div>
              )}

              {needsFile("ninImage") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">NIN image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-[#6B7C99] dark:text-[#8FA0BC] file:mr-3 file:rounded-xl file:border-0 file:bg-[#EAF0FB] dark:file:bg-[#16202E] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1A2B4A] dark:file:text-[#E8F0FA] hover:file:bg-[#D4E3F7] dark:hover:file:bg-[#1E2A3A]"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) form.setValue("ninImage", f, { shouldValidate: false });
                    }}
                  />
                  {errorText(form.formState.errors.ninImage?.message) && (
                    <p className="text-sm text-[#D9534F] dark:text-red-300">{errorText(form.formState.errors.ninImage?.message)}</p>
                  )}
                </div>
              )}

              {needsFile("selfie") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Selfie image</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="block w-full text-sm text-[#6B7C99] dark:text-[#8FA0BC] file:mr-3 file:rounded-xl file:border-0 file:bg-[#EAF0FB] dark:file:bg-[#16202E] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1A2B4A] dark:file:text-[#E8F0FA] hover:file:bg-[#D4E3F7] dark:hover:file:bg-[#1E2A3A]"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) form.setValue("selfieImage", f, { shouldValidate: false });
                    }}
                  />
                  {errorText(form.formState.errors.selfieImage?.message) && (
                    <p className="text-sm text-[#D9534F] dark:text-red-300">{errorText(form.formState.errors.selfieImage?.message)}</p>
                  )}
                </div>
              )}

              {needsFile("utilityBill") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Utility bill</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="block w-full text-sm text-[#6B7C99] dark:text-[#8FA0BC] file:mr-3 file:rounded-xl file:border-0 file:bg-[#EAF0FB] dark:file:bg-[#16202E] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1A2B4A] dark:file:text-[#E8F0FA] hover:file:bg-[#D4E3F7] dark:hover:file:bg-[#1E2A3A]"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) form.setValue("utilityBill", f, { shouldValidate: false });
                    }}
                  />
                  {errorText(form.formState.errors.utilityBill?.message) && (
                    <p className="text-sm text-[#D9534F] dark:text-red-300">{errorText(form.formState.errors.utilityBill?.message)}</p>
                  )}
                </div>
              )}

              {needsText("bio") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Bio</label>
                  <textarea
                    className="min-h-[96px] w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                    {...form.register("bio")}
                  />
                  {errorText(form.formState.errors.bio?.message) && (
                    <p className="text-sm text-[#D9534F] dark:text-red-300">{errorText(form.formState.errors.bio?.message)}</p>
                  )}
                </div>
              )}

              {isFixer && needsText("skills") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Skills</label>
                  <div className="flex gap-2">
                    <input
                      list="skills-list"
                      className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Type a skill and add"
                    />
                    <datalist id="skills-list">
                      {SKILLS_LIST.map((skill) => (
                        <option key={skill} value={skill} />
                      ))}
                    </datalist>
                    <button
                      type="button"
                      className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
                      onClick={addSkill}
                    >
                      Add
                    </button>
                  </div>

                  {skills?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {skills.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => removeSkill(s)}
                          className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] transition hover:bg-[#D4E3F7] dark:hover:bg-[#1E2A3A]"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {errorText(form.formState.errors.skills?.message) && (
                    <p className="text-sm text-[#D9534F] dark:text-red-300">{errorText(form.formState.errors.skills?.message)}</p>
                  )}
                </div>
              )}

              {needsText("address") && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Address</p>

                  {[
                    ["addressHouse", "House number"],
                    ["addressStreet", "Street name"],
                    ["addressArea", "Area"],
                    ["nearestBusStop", "Nearest bus stop"],
                    ["lga", "LGA"],
                    ["city", "City/Town"],
                    ["state", "State"],
                  ].map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{label}</label>
                      <input
                        className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                        {...form.register(key as any)}
                      />
                      {errorText((form.formState.errors as any)[key]?.message) && (
                        <p className="text-sm text-[#D9534F] dark:text-red-300">
                          {errorText((form.formState.errors as any)[key]?.message)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(needsText("instagram") || needsText("tiktok")) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {needsText("instagram") && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Instagram (optional)</label>
                      <input
                        className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                        {...form.register("instagram")}
                      />
                    </div>
                  )}

                  {needsText("tiktok") && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">TikTok (optional)</label>
                      <input
                        className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                        {...form.register("tiktok")}
                      />
                    </div>
                  )}
                </div>
              )}

              {localError && (
                <div className="rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                  {localError}
                </div>
              )}

              <button
                type="submit"
                disabled={!isAuthed || !canSubmit || submitMutation.isPending}
                className="w-full rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-semibold text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitMutation.isPending
                  ? isRejected
                    ? "Resubmitting…"
                    : "Submitting…"
                  : isReuploadRequest
                    ? "Submit corrected field(s)"
                    : isRejected
                      ? "Resubmit verification"
                      : "Submit verification"}
              </button>

              {submitMutation.isError && (
                <div className="rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                  <p className="font-semibold">Submission failed.</p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {(() => {
                      const e: any = submitMutation.error;
                      const msg = e?.response?.data?.message;
                      if (Array.isArray(msg)) return msg.join(", ");
                      if (typeof msg === "string" && msg.trim()) return msg;
                      if (e?.message) return e.message;
                      return "Unknown error";
                    })()}
                  </p>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}