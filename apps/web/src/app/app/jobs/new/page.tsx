// Path: apps/web/src/app/app/jobs/new/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { z } from "zod";

import { useCreateJob, useInitializePostingPayment } from "@/lib/jobs/queries";
import { useMyVerification } from "@/lib/verification/queries";
import { getToken, getStoredRoles } from "@/lib/auth/session";

const CreateJobUiSchema = z.object({
  skillCategory: z.string().min(2, "Skill category is required"),
  state: z.string().min(2, "State is required"),
  city: z.string().min(2, "City is required"),
  lga: z.string().optional(),
  area: z.string().optional(),
  priceFec: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !Number.isNaN(Number(v)), "Price must be a number")
    .refine((v) => Number(v) > 0, "Price must be > 0"),
});

type CreateJobUiValues = z.infer<typeof CreateJobUiSchema>;

type PreviewItem = {
  file: File;
  url: string;
};

export default function NewJobPage() {
  const router = useRouter();
  const { data: ver, isLoading: verLoading } = useMyVerification();
  const createMutation = useCreateJob();
  const postingPayment = useInitializePostingPayment();

  const [mounted, setMounted] = useState(false);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const token = mounted ? getToken() : null;
  const roles = mounted ? getStoredRoles() : [];
  const isClient = roles.includes("CLIENT");
  const isAuthed = !!token;

  const isApproved = ver?.status === "APPROVED";

  const form = useForm<CreateJobUiValues>({
    resolver: zodResolver(CreateJobUiSchema),
    defaultValues: {
      skillCategory: "",
      state: "",
      city: "",
      lga: "",
      area: "",
      priceFec: "",
    },
    mode: "onTouched",
  });

  function handleImages(files: FileList | null) {
    if (!files) return;

    const nextFiles = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5);

    const mapped = nextFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return mapped;
    });
  }

  function removePreview(index: number) {
    setPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(values: CreateJobUiValues) {
  const priceMilliFec = Math.round(Number(values.priceFec) * 1000);

  const job = await createMutation.mutateAsync({
    skillCategory: values.skillCategory,
    state: values.state,
    city: values.city,
    lga: values.lga?.trim() ? values.lga.trim() : undefined,
    area: values.area?.trim() ? values.area.trim() : undefined,
    priceMilliFec,
    images: previews.map((p) => p.file),
  });

  const jobId = job?.id ?? job?.jobId;

  if (!jobId) {
    throw new Error("Unable to determine Job ID.");
  }

  const payment = await postingPayment.mutateAsync(jobId);

  const checkoutUrl =
    payment?.checkoutUrl ??
    payment?.paymentUrl ??
    payment?.authorizationUrl;

  if (!checkoutUrl) {
    throw new Error("Payment URL was not returned.");
  }

  window.location.assign(checkoutUrl);
}

  const blockedReason = useMemo(() => {
    if (!mounted) return "Loading…";
    if (!isAuthed) return "Not authenticated.";
    if (!roles.length) return "Roles missing. Re-login with JSON login response.";
    if (!isClient) return "Only CLIENT can post jobs.";
    if (verLoading) return "Checking verification…";
    if (!isApproved) return "Verification must be APPROVED to post jobs.";
    return null;
  }, [mounted, isAuthed, roles.length, isClient, verLoading, isApproved]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div>
        <Link
          href="/app/jobs"
          className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
        >
          ← Back to jobs
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Post a job
        </h1>
        <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Add clear details and optional photos of the problem.
        </p>
      </div>

      {blockedReason ? (
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{blockedReason}</p>

          {!isAuthed ? (
            <p className="mt-2 text-[#6B7C99] dark:text-[#8FA0BC]">
              Go to{" "}
              <Link
                className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
                href="/login"
              >
                /login
              </Link>{" "}
              and paste your login JSON.
            </p>
          ) : null}

          {mounted && isAuthed && !isClient ? (
            <p className="mt-2 text-[#6B7C99] dark:text-[#8FA0BC]">
              If you meant to be a client, switch your role to CLIENT and log in again.
            </p>
          ) : null}

          <Link
            className="mt-4 inline-block font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
            href="/app/jobs"
          >
            Go back
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Skill category
              </label>
              <input
                className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="e.g. Plumber"
                {...form.register("skillCategory")}
              />
              {form.formState.errors.skillCategory?.message && (
                <p className="text-sm text-[#D9534F] dark:text-red-300">
                  {form.formState.errors.skillCategory.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["state", "State"],
                ["city", "City/Town"],
                ["lga", "LGA (optional)"],
                ["area", "Area (optional)"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {label}
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                    {...form.register(key as any)}
                  />
                  {(form.formState.errors as any)[key]?.message && (
                    <p className="text-sm text-[#D9534F] dark:text-red-300">
                      {(form.formState.errors as any)[key].message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Price (FEC)
              </label>
              <input
                className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                inputMode="decimal"
                placeholder="e.g. 2.5"
                {...form.register("priceFec")}
              />
              {form.formState.errors.priceFec?.message && (
                <p className="text-sm text-[#D9534F] dark:text-red-300">
                  {form.formState.errors.priceFec.message}
                </p>
              )}
              <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                1 FEC = 1000 Naira
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Job images (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="block w-full text-sm text-[#6B7C99] dark:text-[#8FA0BC] file:mr-3 file:rounded-xl file:border-0 file:bg-[#EAF0FB] dark:file:bg-[#16202E] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1A2B4A] dark:file:text-[#E8F0FA] hover:file:bg-[#D4E3F7] dark:hover:file:bg-[#1E2A3A]"
                onChange={(e) => handleImages(e.target.files)}
              />

              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previews.map((p, index) => (
                    <div
                      key={`${p.file.name}-${index}`}
                      className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-2"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#EAF0FB] dark:bg-[#16202E]">
                        <Image
                          src={p.url}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <button
  type="button"
  onClick={() => removePreview(index)}
  className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100`}
>
  Remove
</button>

                    </div>
                  ))}
                </div>
              )}
            </div>
<div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-900 dark:text-blue-200">
  <p className="font-medium">
    Platform Service Fee
  </p>

  <p className="mt-1">
    After creating your job, you&apos;ll be redirected to Monnify to securely pay the platform service fee. Your job will only become visible to fixers after your payment is successfully confirmed.
  </p>
</div>
            <button
  type="submit"
  disabled={
  createMutation.isPending ||
  postingPayment.isPending
}
  className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200
    ${createMutation.isPending
      ? "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"}
  `}
>
  {createMutation.isPending
  ? "Creating job..."
  : postingPayment.isPending
    ? "Preparing secure payment..."
    : "Continue to Payment"}
</button>


            {createMutation.isError && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <p className="font-semibold">Post failed.</p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-6">
                  {(() => {
                    const e: any = createMutation.error;
                    const data = e?.response?.data;
                    if (!data) return e?.message ?? "Unknown error";
                    if (typeof data === "string") return data;
                    if (typeof data?.message === "string") return data.message;
                    if (Array.isArray(data?.message)) return data.message.join(", ");
                    return e?.message ?? "Something went wrong.";
                  })()}
                </p>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}