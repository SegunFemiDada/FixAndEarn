// Path: apps/web/src/app/admin/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import AdminPageHero from "@/components/admin/admin-page-hero";
import AdminStatCard from "@/components/admin/admin-stat-card";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const adminSections = [
  {
    href: "/admin/analytics",
    title: "Analytics",
    description: "View live KPI cards, finance metrics, and chart-ready analytics.",
  },
  {
    href: "/admin/verification",
    title: "Verification queue",
    description: "Review pending verification submissions and make approval decisions.",
  },
  {
    href: "/admin/finance/withdrawals",
    title: "Withdrawal management",
    description: "Process fixer withdrawal requests using live payout status from backend.",
  },
  {
    href: "/admin/users",
    title: "User management",
    description: "Inspect user records, account state, verification state, and internal notes.",
  },
  {
    href: "/admin/disputes",
    title: "Dispute management",
    description: "Handle open disputes and resolve them using existing admin resolution endpoints.",
  },
  {
    href: "/admin/messaging",
    title: "Messaging oversight",
    description: "Review flagged conversations and take moderation action.",
  },
  {
    href: "/admin/security",
    title: "Security center",
    description: "Review admin auth activity, failed attempts, and security-relevant audit logs.",
  },
  {
    href: "/admin/content",
    title: "Content management",
    description: "Manage policies, support content, skills, banks, and notification templates.",
  },
  {
    href: "/admin/settings",
    title: "Platform settings",
    description: "Manage finance, verification, and moderation rules.",
  },
  {
    href: "/admin/2fa",
    title: "2FA",
    description: "Verify your authenticator code and rotate your admin TOTP secret safely.",
  },
  {
    href: "/admin/admins",
    title: "Admin management",
    description: "Create additional admins and review existing admin accounts.",
  },
  {
    href: "/admin/notifications",
    title: "System notifications",
    description: "Send platform notifications to one user, many users, or all active users.",
  },
  {
    href: "/admin/reports",
    title: "Reports center",
    description: "Review user-submitted reports about content and behavior on the platform, and take action.",
  },
  {
    href: "/admin/deletion-requests",
    title: "Deletion requests",
    description: "Review and manage user requests for account deletion.",
  },
  {
    href: "/admin/exports",
    title: "Audit exports",
    description: "Download audit log CSV export directly from the backend.",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Dashboard"
        title="Admin operations"
        description="Access all operational sections of the admin console, review live metrics, and manage platform settings."
        actions={
          <Link
            href="/admin/bootstrap"
            className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2.5 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
          >
            Open bootstrap setup
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(91,143,204,0.2)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {section.title}
              </h3>
              <span className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Live
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              {section.description}
            </p>

            <span className="mt-5 inline-flex text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] group-hover:underline">
              Open section
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}