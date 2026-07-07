// Path: apps/web/src/app/admin/AdminLayoutClient.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  clearAdminSession,
  getAdminToken,
  getStoredAdminIdentity,
} from "@/lib/admin/session";
import { extractApiErrorMessage, useAdminMe } from "@/lib/admin/queries";
import type { AdminNavItem } from "@/lib/admin/types";

const navItems: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Admin entry point",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "View live admin metrics and charts",
  },
  {
    href: "/admin/verification",
    label: "Verification Queue",
    description: "Review pending verification submissions",
  },
  {
    href: "/admin/finance/withdrawals",
    label: "Withdrawals Management",
    description: "Approve, reject, and mark payouts",
  },
  {
    href: "/admin/users",
    label: "User Management",
    description: "Manage user status and notes",
  },
  {
    href: "/admin/disputes",
    label: "Dispute Management",
    description: "Resolve platform disputes",
  },
  {
    href: "/admin/messaging",
    label: "Messaging Oversight",
    description: "Oversee flagged conversations",
  },
  {
    href: "/admin/security",
    label: "Security Center",
    description: "Review admin auth activity and risk flags",
  },
  {
    href: "/admin/content",
    label: "Content Management",
    description: "Manage policies, lists, and templates",
  },
  {
    href: "/admin/settings",
    label: "Platform Settings",
    description: "Manage finance, verification, and moderation rules",
  },
  {
    href: "/admin/2fa",
    label: "2FA",
    description: "Verify and rotate your admin authenticator setup",
  },
  {
    href: "/admin/admins",
    label: "Admin Management",
    description: "Create and manage admin accounts",
  },
  {
    href: "/admin/notifications",
    label: "System Notifications",
    description: "Send system notifications",
  },
  {
    href: "/admin/reports",
    label: "Reports Center",
    description: "View and manage user reports",
  },
  {
    href: "/admin/deletion-requests",
    label: "Deletion Requests",
    description: "Approve or reject account deletions",
  },
  {
    href: "/admin/exports",
    label: "Audit Exports",
    description: "Download audit log CSV",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();


const [mounted, setMounted] = React.useState(false);

React.useEffect(() => {
  setMounted(true);
}, []);

const token = mounted ? getAdminToken() : null;
console.log("LAYOUT", {
  pathname,
  token,
  mounted,
});

  const isLoginPage = pathname === "/admin/login";
  const isBootstrapPage = pathname === "/admin/bootstrap";
  const isPublicAdminPage = isLoginPage || isBootstrapPage;
  const shouldCheckAdmin = Boolean(token) && !isPublicAdminPage;

  const meQuery = useAdminMe(shouldCheckAdmin);

  React.useEffect(() => {
    if (!mounted) return;

    if (!token && !isPublicAdminPage) {
      console.log("Redirecting to login because token is missing");
      router.replace("/admin/login");
    }
  }, [isPublicAdminPage, mounted, router, token]);

  React.useEffect(() => {
  if (!mounted || isPublicAdminPage) return;

  if (meQuery.isPending) return;

  if (meQuery.isError) {
    console.log("Error occurred while fetching admin identity");
    clearAdminSession();
    router.replace("/admin/login");
  }
}, [
  mounted,
  isPublicAdminPage,
  meQuery.isPending,
  meQuery.isError,
  router,
]);

  const identity = meQuery.data?.admin ?? (mounted ? getStoredAdminIdentity() : null);

  function handleLogout() {
    clearAdminSession();
    router.replace("/admin/login");
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827]">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading admin area...</p>
        </div>
      </div>
    );
  }

  if (isPublicAdminPage) {
    return <>{children}</>;
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 py-4 lg:h-screen lg:max-h-screen lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
        <aside className="w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] lg:flex lg:h-full lg:w-80 lg:min-w-80 lg:flex-col lg:overflow-hidden">
          <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Signed in as
            </p>
            <p className="mt-2 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {identity?.fullName ?? "Admin"}
            </p>
            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {identity?.email ?? "Loading email..."}
            </p>
            <p className="mt-3 inline-flex rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              {identity?.role ?? "Loading role..."}
            </p>
          </div>

          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1 admin-sidebar-scroll">
            <nav className="mt-4 space-y-2">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "block rounded-xl border px-4 py-3 transition",
                      active
                        ? "border-[#5B8FCC] dark:border-[#5B8FCC] bg-[#5B8FCC] dark:bg-[#5B8FCC] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)]"
                        : "border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div
                      className={[
                        "mt-1 text-xs leading-5",
                        active ? "text-white/80" : "text-[#6B7C99] dark:text-[#8FA0BC]",
                      ].join(" ")}
                    >
                      {item.description}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-4">
          <button
  type="button"
  onClick={handleLogout}
  className="
    inline-flex items-center justify-center gap-2
    rounded-lg px-4 py-2 font-semibold
    bg-red-600 text-white
    hover:bg-red-700 focus:ring-2 focus:ring-red-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-red-500 dark:text-white
    dark:hover:bg-red-600 dark:focus:ring-red-300
  "
>
  <svg
    className="h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
    />
  </svg>
  Sign out
</button>

        </div>
        </aside>

        <main className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto lg:pr-1">
          <div className="space-y-6">
            {meQuery.isLoading ? (
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Checking admin session...</p>
              </div>
            ) : meQuery.isError ? (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <h2 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">
                  Admin session failed
                </h2>
                <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">
                  {extractApiErrorMessage(meQuery.error)}
                </p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}