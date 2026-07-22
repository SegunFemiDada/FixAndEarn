//path: apps/web/src/app/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useLogin, extractAuthErrorMessage } from "@/lib/auth/queries";
import { getToken } from "@/lib/auth/session";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [registered, setRegistered] = React.useState(false);
  const [resetDone, setResetDone] = React.useState(false);
  const [expired, setExpired] =
  React.useState(false);

  React.useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace("/app/continue");
      return;
    }
    

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setRegistered(params.get("registered") === "1");
      setResetDone(params.get("reset") === "1");
      setExpired(params.get("expired") === "1");
      
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    login.mutate(
      {
        email: email.trim(),
        password,
      },
      {
        onSuccess: () => {
          router.replace("/app/continue");
        },
      }
    );
  }

  const isDisabled = login.isPending || !email.trim() || !password;
  const [showPassword, setShowPassword] = useState(false);

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
              Log in
            </h1>
            <p className="text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Access your account with your registered email and password.
            </p>
          </div>

          {/* Success banners */}
          {registered && (
            <div className="mb-6 rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 px-4 py-3 text-sm text-[#2E7D32] dark:text-green-200">
              Account created successfully. Log in to continue.
            </div>
          )}

          {resetDone && (
            <div className="mb-6 rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 px-4 py-3 text-sm text-[#2E7D32] dark:text-green-200">
              Password reset successful. Log in with your new password.
            </div>
          )}
          {expired && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your session has expired. Please log in again.
          </div>
        )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#C5D8F0]"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#C5D8F0]"
                >
                  Password
                </label>
                <Link
                  className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
                  href="/forgot-password"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="space-y-2">


  <div className="relative">
    <input
      id="login-password"
      type={showPassword ? "text" : "password"}
      autoComplete="current-password"
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      className="w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 pr-12 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
      placeholder="Enter password"
      required
    />

    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="absolute inset-y-0 right-3 flex items-center text-[#6B7C99] dark:text-[#8FA0BC] hover:text-[#5B8FCC] transition"
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
</div>
            </div>

            {/* Error */}
            {login.isError && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 px-4 py-3 text-sm text-[#D9534F] dark:text-red-300">
                {extractAuthErrorMessage(login.error)}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isDisabled}
              className={
                isDisabled
                  ? "inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold text-[#9BAEC8] dark:text-[#4A6080] bg-[#EAF0FB] dark:bg-[#1E2A3A] border-2 border-[#C5D5EE] dark:border-[#2D3F55] cursor-not-allowed transition-all duration-200"
                  : "inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold text-white bg-[#5B8FCC] hover:bg-[#4A7DBB] active:bg-[#3E6EAA] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] dark:active:bg-[#3E6EAA] shadow-md shadow-[#5B8FCC]/30 hover:shadow-lg hover:shadow-[#5B8FCC]/40 active:shadow-sm transition-all duration-200 border-0"
              }
            >
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 space-y-2 border-t border-[#E4EDF8] dark:border-[#2D3F55] pt-5 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            <p>
              <Link
                href="/resend-verification"
                className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
              >
                Resend verification email
              </Link>
            </p>
            <p>
              Don&apos;t have an account?{" "}
              <Link
                className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
                href="/register"
              >
                Create one
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}