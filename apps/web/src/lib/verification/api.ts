// Path: apps/web/src/lib/verification/api.ts
import { z } from "zod";
import apiClient from "@/lib/apiClient";
import {
  VerificationMeResponseSchema,
  type VerificationMeResponse,
  type VerificationSubmitFormValues,
} from "./types";

function parseOrThrow<T>(schema: z.ZodSchema<T>, data: any): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Unexpected API response shape from /verification/me");
  }
  return parsed.data;
}

export async function getMyVerification(): Promise<VerificationMeResponse> {
  const res = await apiClient.get("/verification/me");
  return parseOrThrow(VerificationMeResponseSchema, res.data);
}

export async function submitVerification(values: VerificationSubmitFormValues): Promise<void> {
  const fd = new FormData();

  const bvn = values.bvn?.trim();
  const bio = values.bio?.trim();

  if (bvn) fd.append("bvn", bvn);
  if (bio) fd.append("bio", bio);

  if (Array.isArray(values.skills) && values.skills.length > 0) {
    values.skills.forEach((s, i) => {
      if (typeof s === "string" && s.trim()) {
        fd.append(`skills[${i}]`, s.trim());
      }
    });
  }

  const hasAnyAddress =
    (values.addressHouse?.trim() ?? "") ||
    (values.addressStreet?.trim() ?? "") ||
    (values.addressArea?.trim() ?? "") ||
    (values.nearestBusStop?.trim() ?? "") ||
    (values.lga?.trim() ?? "") ||
    (values.city?.trim() ?? "") ||
    (values.state?.trim() ?? "");

  if (hasAnyAddress) {
    if (values.addressHouse?.trim()) fd.append("address[house]", values.addressHouse.trim());
    if (values.addressStreet?.trim()) fd.append("address[street]", values.addressStreet.trim());
    if (values.addressArea?.trim()) fd.append("address[area]", values.addressArea.trim());
    if (values.nearestBusStop?.trim()) fd.append("address[busStop]", values.nearestBusStop.trim());
    if (values.lga?.trim()) fd.append("address[lga]", values.lga.trim());
    if (values.city?.trim()) fd.append("address[city]", values.city.trim());
    if (values.state?.trim()) fd.append("address[state]", values.state.trim());
  }

  if (values.ninImage) fd.append("ninImage", values.ninImage);
  if (values.selfieImage) fd.append("selfie", values.selfieImage);
  if (values.utilityBill) fd.append("utilityBill", values.utilityBill);

  if (values.instagram?.trim()) fd.append("instagram", values.instagram.trim());
  if (values.tiktok?.trim()) fd.append("tiktok", values.tiktok.trim());

  await apiClient.post("/verification/submit", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}