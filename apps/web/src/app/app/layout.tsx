//path: apps/web/src/app/app/layout.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Briefcase,
  Wallet,
  User,
  Bell,
} from "lucide-react";
import { clearSession, getActiveRole, type Role } from "@/lib/auth/session";
import { useNotificationsUnreadCount } from "@/lib/notifications/queries";
import { useMyVerification } from "@/lib/verification/queries";

function UnreadBadge({ count }: { count: number }) {
  if (!count || count <= 0) return null;

  return (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-[#F2C0BC] dark:border-red-700 bg-[#D9534F] dark:bg-red-700 px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
      {count}
    </span>
  );
}

function navLinkClass() {
  return "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#EAF0FB] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  useEffect(() => {
    setMounted(true);
    setActiveRole(getActiveRole());
  }, []);

  const { data } = useNotificationsUnreadCount(mounted ? activeRole : null);
  const unread = data ?? 0;

  const { data: verification } = useMyVerification();
  const isVerified = verification?.status === "APPROVED";

  function handleSignOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827]">
      <header className="border-b border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] shadow-[0_2px_12px_rgba(91,143,204,0.08)] dark:shadow-none">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA]"
            >
              <span className="text-lg text-[#5B8FCC] dark:text-[#7AAEE0]">🔧</span>
              <span>FixAndEarn</span>
            </Link>

            <div className="flex items-center gap-2">
              {activeRole ? (
                <span className="inline-flex items-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {activeRole}
                </span>
              ) : null}

              <button
  type="button"
  onClick={handleSignOut}
  className="
    inline-flex items-center justify-center gap-2
    rounded-lg px-3 py-2 font-semibold
    bg-red-600 text-white
    hover:bg-red-700 focus:ring-2 focus:ring-red-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-red-500 dark:text-white
    dark:hover:bg-red-600 dark:focus:ring-red-300
  "
>
  Sign out
</button>

            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
  <Link href="/app/dashboard" className={navLinkClass()}>
    <Home className="h-4 w-4" />
    <span>Dashboard</span>
  </Link>

  <Link href="/app/jobs" className={navLinkClass()}>
    <Briefcase className="h-4 w-4" />
    <span>Jobs</span>
  </Link>

  <Link href="/app/wallet" className={navLinkClass()}>
    <Wallet className="h-4 w-4" />
    <span>Wallet</span>
  </Link>

  {!isVerified ? (
    <Link href="/app/verification" className={navLinkClass()}>
      <span>Verification</span>
    </Link>
  ) : null}

  <Link href="/app/profile" className={navLinkClass()}>
    <User className="h-4 w-4" />
    <span>Profile</span>
  </Link>

  <Link href="/app/notifications" className={navLinkClass()}>
    <Bell className="h-4 w-4" />
    <span>Notifications</span>
    <UnreadBadge count={unread} />
  </Link>
</nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}