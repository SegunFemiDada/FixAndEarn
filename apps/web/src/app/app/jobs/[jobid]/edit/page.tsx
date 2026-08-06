// apps/web/src/app/app/jobs/[jobid]/edit/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useJobById, useUpdateJob } from "@/lib/jobs/queries";
import { useMyVerification } from "@/lib/verification/queries";
import { getActiveRole, getToken } from "@/lib/auth/session";
import { useJobApplications } from "@/lib/jobs/applications-queries";

const EditJobSchema = z.object({
  skillCategory: z.string().min(2, "Skill category is required"),
  state: z.string().min(2, "State is required"),
  city: z.string().min(2, "City is required"),
  lga: z.string().optional(),
  area: z.string().optional(),
  priceFec: z.number().positive("Price must be > 0"),
});

type EditJobForm = z.infer<typeof EditJobSchema>;

function toMilliFec(amountFec: number) {
  return Math.round(amountFec * 1000);
}

export default function EditJobPage() {
  const params = useParams<{ jobid: string }>();
  const router = useRouter();
  const jobId = params?.jobid;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const token = mounted ? getToken() : null;
  const activeRole = mounted ? getActiveRole() : null;
  const isClient = activeRole === "CLIENT";

  const verification = useMyVerification();
  const isVerifiedApproved = verification.data?.status === "APPROVED";

  const gateOk = !!token && isVerifiedApproved && isClient;

  const { data: job, isLoading } = useJobById(jobId);
  const updateJob = useUpdateJob(jobId);
  const applicationsQuery = useJobApplications(jobId, { skip: 0, take: 1, enabled: gateOk && !!jobId });
  const hasApplications = (applicationsQuery.data?.total ?? 0) > 0;

  const isDraft = job?.status === "DRAFT";
const isOpenWithoutApplicants =
  job?.status === "OPEN" && !hasApplications;

const canEdit =
  isDraft || isOpenWithoutApplicants;

  const form = useForm<EditJobForm>({
    resolver: zodResolver(EditJobSchema),
    defaultValues: {
      skillCategory: "",
      state: "",
      city: "",
      lga: "",
      area: "",
      priceFec: 0,
    },
  });

  useEffect(() => {
    if (job) {
      form.reset({
        skillCategory: job.skillCategory ?? "",
        state: job.state ?? "",
        city: job.city ?? "",
        lga: job.lga ?? "",
        area: job.area ?? "",
        priceFec: (job.priceMilliFec ?? 0) / 1000,
      });
    }
  }, [job, form]);

  async function onSubmit(values: EditJobForm) {
    await updateJob.mutateAsync({
      skillCategory: values.skillCategory,
      state: values.state,
      city: values.city,
      lga: values.lga || undefined,
      area: values.area || undefined,
      priceMilliFec: toMilliFec(values.priceFec),
    });
    router.push(`/app/jobs/${jobId}`);
  }

  if (!mounted || isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Loading...
        </div>
      </div>
    );
  }

  if (!gateOk) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          You are not authorized to edit this job.
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-4 text-sm text-[#B45309] dark:text-amber-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          This job cannot be edited because it is not OPEN or already has applications.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="mb-4">
          <Link
            href={`/app/jobs/${jobId}`}
            className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
          >
            ← Back to job
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Edit job</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Skill category
            </label>
            <input
              {...form.register("skillCategory")}
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
            {form.formState.errors.skillCategory && (
              <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                {form.formState.errors.skillCategory.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">State</label>
              <input
                {...form.register("state")}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              />
              {form.formState.errors.state && (
                <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                  {form.formState.errors.state.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">City</label>
              <input
                {...form.register("city")}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              />
              {form.formState.errors.city && (
                <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                LGA (optional)
              </label>
              <input
                {...form.register("lga")}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Area (optional)
              </label>
              <input
                {...form.register("area")}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Price (FEC)
            </label>
            <input
              type="number"
              step="0.01"
              {...form.register("priceFec", { valueAsNumber: true })}
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
            {form.formState.errors.priceFec && (
              <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                {form.formState.errors.priceFec.message}
              </p>
            )}
          </div>

          {updateJob.isError && (
            <div className="rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
              {updateJob.error?.message || "Update failed"}
            </div>
          )}

          <div className="flex gap-2">
           <button
  type="submit"
  disabled={updateJob.isPending}
  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300
    disabled:opacity-50 disabled:cursor-not-allowed`}
>
  {updateJob.isPending ? "Saving..." : "Save changes"}
</button>

<Link
  href={`/app/jobs/${jobId}`}
  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100`}
>
  Cancel
</Link>

          </div>
        </form>
      </div>
    </div>
  );
}