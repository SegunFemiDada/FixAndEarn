//path: apps/web/src/app/register/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { extractAuthErrorMessage, useRegister } from "@/lib/auth/queries";
import { getToken } from "@/lib/auth/session";
import { useState } from "react";

const RegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptTerms: z
    .boolean()
    .refine((value) => value === true, "You must accept the terms and conditions"),
});

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();

  React.useEffect(() => {
    const token = getToken();
    if (token) router.replace("/app/continue");
  }, [router]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const isBusy = isSubmitting || registerMutation.isPending;
const [showPassword, setShowPassword] = useState(false);

  const onSubmit = handleSubmit((values) => {
    registerMutation.mutate(
      {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      },
      {
        onSuccess: () => {
          router.replace(`/verify-email-prompt?email=${encodeURIComponent(values.email.trim())}`);
        },
      }
    );
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-10 sm:py-16 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white dark:bg-[#1E2A3A] p-6 sm:p-8 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">

          {/* Header */}
          <div className="space-y-1 mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              FixAndEarn
            </p>
            <h1 className="text-2xl font-bold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Create account
            </h1>
            <p className="text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Register with your full name, email, and password to get started.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={onSubmit}>

            {/* Full Name */}
            <div className="space-y-2">
              <label
                htmlFor="register-fullname"
                className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#C5D8F0]"
              >
                Full name
              </label>
              <input
                id="register-fullname"
                type="text"
                autoComplete="name"
                className="w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="John Doe"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-[#D9534F] dark:text-red-400">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="register-email"
                className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#C5D8F0]"
              >
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                className="w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-[#D9534F] dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
<div className="space-y-2">
  <label
    htmlFor="register-password"
    className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#C5D8F0]"
  >
    Password
  </label>

  <div className="relative">
    <input
      id="register-password"
      type={showPassword ? "text" : "password"}
      autoComplete="new-password"
      className="w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 pr-12 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
      placeholder="At least 8 characters"
      {...register("password")}
    />

    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="absolute inset-y-0 right-3 flex items-center rounded-full p-1 text-[#6B7C99] dark:text-[#8FA0BC] hover:text-[#5B8FCC] transition"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      )}
    </button>
  </div>

  {errors.password && (
    <p className="text-sm text-[#D9534F] dark:text-red-400">
      {errors.password.message}
    </p>
  )}
</div>

            {/* Terms checkbox */}
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3">
              <label className="flex items-start gap-3 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[#C5D5EE] dark:border-[#2D3F55] accent-[#5B8FCC]"
                  {...register("acceptTerms")}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-2 text-sm text-[#D9534F] dark:text-red-400">{errors.acceptTerms.message}</p>
              )}
            </div>

            {/* API error */}
            {registerMutation.isError && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 px-4 py-3 text-sm text-[#D9534F] dark:text-red-300">
                {extractAuthErrorMessage(registerMutation.error)}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isBusy}
              className={[
                "inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                isBusy
                  ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                  : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
              ].join(" ")}
            >
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 space-y-2 border-t border-[#E4EDF8] dark:border-[#2D3F55] pt-5 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            <p>
              Already have an account?{" "}
              <Link className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline" href="/login">
                Log in
              </Link>
            </p>
            <p>
              Didn&apos;t get your verification email?{" "}
              <Link
                className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
                href="/resend-verification"
              >
                Resend verification
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}