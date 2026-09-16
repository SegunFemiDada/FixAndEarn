"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import {
  clearAdminSession,
  getAdminToken,
  getStoredAdminIdentity,
} from "@/lib/admin/session";

import {
  extractApiErrorMessage,
  useAdminMe,
} from "@/lib/admin/queries";

import type { AdminNavItem } from "@/lib/admin/types";

import {
  useAdminSidebarNotifications,
} from "@/lib/admin/sidebar-notifications/queries";

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
    href: "/admin/jobs",
    label: "Job Management",
    description:
      "Investigate jobs, applications, payments, and disputes",
  },
  {
    href: "/admin/payments",
    label: "Payment Operations",
    description:
      "Investigate job payments and Monnify references",
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
    description:
      "Review admin auth activity and risk flags",
  },
  {
    href: "/admin/content",
    label: "Content Management",
    description:
      "Manage policies, lists, and templates",
  },
  {
    href: "/admin/settings",
    label: "Platform Settings",
    description:
      "Manage finance, verification, and moderation rules",
  },
  {
    href: "/admin/2fa",
    label: "2FA",
    description:
      "Verify and rotate your admin authenticator setup",
  },
  {
    href: "/admin/admins",
    label: "Admin Management",
    description:
      "Create and manage admin accounts",
  },
  {
    href: "/admin/notifications",
    label: "System Notifications",
    description:
      "Send system notifications",
  },
  {
    href: "/admin/reports",
    label: "Reports Center",
    description:
      "View and manage user reports",
  },
  {
    href: "/admin/deletion-requests",
    label: "Deletion Requests",
    description:
      "Approve or reject account deletions",
  },
  {
    href: "/admin/exports",
    label: "Audit Exports",
    description:
      "Download audit log CSV",
  },
];

function getNotificationCount(
  href: string,
  sidebarNotifications: any,
): number {
  if (!sidebarNotifications) {
    return 0;
  }

  switch (href) {
    case "/admin/verification":
      return sidebarNotifications.verificationQueue;

    case "/admin/finance/withdrawals":
      return sidebarNotifications.withdrawalManagement;

    case "/admin/disputes":
      return sidebarNotifications.disputeManagement;

    case "/admin/messaging":
      return sidebarNotifications.messagingOversight;

    case "/admin/security":
      return sidebarNotifications.securityCenter;

    case "/admin/deletion-requests":
      return sidebarNotifications.deletionRequests;

    case "/admin/reports":
      return sidebarNotifications.reportsCenter;

    default:
      return 0;
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] =
    React.useState(false);

  const [token, setToken] =
    React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    setToken(getAdminToken());
  }, [mounted, pathname]);

  const isLoginPage =
    pathname === "/admin/login";

  const isBootstrapPage =
    pathname === "/admin/bootstrap";

  const isPublicAdminPage =
    isLoginPage || isBootstrapPage;

  const shouldCheckAdmin =
    Boolean(token) && !isPublicAdminPage;

  const meQuery =
    useAdminMe(shouldCheckAdmin);

  const {
    data: sidebarNotifications,
  } =
    useAdminSidebarNotifications(
      shouldCheckAdmin,
    );

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    const latestToken =
      getAdminToken();

    if (
      !latestToken &&
      !isPublicAdminPage
    ) {
      router.replace("/admin/login");
    }
  }, [
    mounted,
    pathname,
    isPublicAdminPage,
    router,
    token,
  ]);

  React.useEffect(() => {
    if (
      !mounted ||
      isPublicAdminPage
    ) {
      return;
    }

    if (meQuery.isPending) {
      return;
    }

    if (meQuery.isError) {
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

  const identity =
    meQuery.data?.admin ??
    (mounted
      ? getStoredAdminIdentity()
      : null);

  function handleLogout() {
    clearAdminSession();
    router.replace("/admin/login");
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#EEF4FB] dark:bg-[#111827]">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_8px_32px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Loading admin area...
            </p>
          </div>
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
    <div className="min-h-screen bg-[#EEF4FB] text-[#1A2B4A] dark:bg-[#111827] dark:text-[#E8F0FA]">
      <div className="flex min-h-screen w-full flex-col">
        {/* Admin top bar */}
        <header className="sticky top-0 z-40 h-18 shrink-0 border-b border-[#C5D5EE] bg-white/95 backdrop-blur dark:border-[#2D3F55] dark:bg-[#172231]/95">
          <div className="flex h-full items-center justify-between gap-6 px-6 xl:px-8">
            <div className="min-w-0">
              <div className="text-[11px] font-bold tracking-[0.22em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                FixAndEarn
              </div>

              <div className="mt-0.5 truncate text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Admin Operations Console
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="hidden text-right md:block">
                <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {identity?.fullName ?? "Admin"}
                </p>

                <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  {identity?.email ?? "Loading email..."}
                </p>
              </div>

              <span className="hidden rounded-full border border-[#C5D5EE] bg-[#EAF0FB] px-3 py-1.5 text-xs font-semibold text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] lg:inline-flex">
                {identity?.role ?? "Admin"}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Desktop-first admin workspace */}
        <div className="flex min-h-0 flex-1">
          {/* Persistent navigation */}
          <aside className="sticky top-18 hidden h-[calc(100vh-72px)] w-69 shrink-0 border-r border-[#C5D5EE] bg-white dark:border-[#2D3F55] dark:bg-[#1E2A3A] xl:flex xl:flex-col">
            <div className="border-b border-[#C5D5EE] px-5 py-5 dark:border-[#2D3F55]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6B7C99] dark:text-[#8FA0BC]">
                Operations
              </p>

              <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Use the navigation to move between operational areas.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 admin-sidebar-scroll">
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const active =
                    pathname === item.href;

                  const count =
                    getNotificationCount(
                      item.href,
                      sidebarNotifications,
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "block rounded-xl border px-3.5 py-3 transition-colors",
                        active
                          ? "border-[#5B8FCC] bg-[#5B8FCC] text-white shadow-[0_3px_16px_rgba(91,143,204,0.22)]"
                          : "border-transparent bg-transparent hover:border-[#C5D5EE] hover:bg-[#F4F8FF] dark:hover:border-[#2D3F55] dark:hover:bg-[#16202E]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">
                          {item.label}
                        </span>

                        {count > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {count}
                          </span>
                        ) : null}
                      </div>

                      <div
                        className={[
                          "mt-1 text-[11px] leading-4",
                          active
                            ? "text-white/80"
                            : "text-[#6B7C99] dark:text-[#8FA0BC]",
                        ].join(" ")}
                      >
                        {item.description}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-[#C5D5EE] p-4 dark:border-[#2D3F55]">
              <div className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-3 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Signed in as
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {identity?.fullName ?? "Admin"}
                </p>

                <p className="mt-0.5 truncate text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  {identity?.email ?? "Loading email..."}
                </p>

                <span className="mt-2 inline-flex rounded-full border border-[#C5D5EE] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA]">
                  {identity?.role ?? "Admin"}
                </span>
              </div>
            </div>
          </aside>

          {/* Main workspace */}
          <main className="min-w-0 flex-1 overflow-auto">
            <div className="min-w-245 px-6 py-6 xl:px-8 xl:py-8">
              <div className="mx-auto w-full">
                {meQuery.isLoading ? (
                  <div className="rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_8px_32px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      Checking admin session...
                    </p>
                  </div>
                ) : meQuery.isError ? (
                  <div className="rounded-2xl border border-[#F2C0BC] bg-[#FFF4F3] p-6 shadow-[0_8px_32px_rgba(91,143,204,0.10)] dark:border-red-700 dark:bg-red-900/20 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <h2 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">
                      Admin session failed
                    </h2>

                    <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">
                      {extractApiErrorMessage(
                        meQuery.error,
                      )}
                    </p>
                  </div>
                ) : (
                  children
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Narrow viewport fallback */}
        <div className="fixed bottom-4 left-1/2 z-50 hidden -translate-x-1/2 rounded-full border border-[#F5A623] bg-[#FEF8E7] px-4 py-2 text-xs font-semibold text-[#B45309] shadow-lg dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 max-xl:flex">
          Best experienced on a desktop-sized screen.
        </div>
      </div>
    </div>
  );
}