//path: apps/web/src/app/support/contact/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getToken } from "@/lib/auth/session";

const contactSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Please provide enough detail (min 20 characters)"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactSupportPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactForm) {
    setStatus("loading");
    setErrorMsg(null);

    const token = getToken();
    let userId: string | null = null;
    if (token) {
      try {
        // Simulate decoding the user ID from the token
        userId = "user123"; // Replace with actual user ID decoding logic
      } catch (error) {
        console.error("Failed to decode user ID from token", error);
      }
    }

    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subject: data.subject,
          message: data.message,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setStatus("success");
      form.reset();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again later or email us directly at support@fixandearn.com.");
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Contact Support</h1>
          <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Fill out the form below. We&apos;ll respond within 24 hours.
          </p>

          {status === "success" && (
            <div className="mt-4 rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
              Message sent successfully! We&apos;ll get back to you soon.
            </div>
          )}

          {status === "error" && (
            <div className="mt-4 rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Subject</label>
              <input
                {...form.register("subject")}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="e.g. Withdrawal issue"
              />
              {form.formState.errors.subject && (
                <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Message</label>
              <textarea
                {...form.register("message")}
                rows={6}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="Describe your issue in detail..."
              />
              {form.formState.errors.message && (
                <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">{form.formState.errors.message.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending..." : "Send message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}