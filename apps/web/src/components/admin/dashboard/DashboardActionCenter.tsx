import * as React from "react";
import Link from "next/link";

type ActionItem = {
  href: string;
  label: string;
  description: string;
  count: number;
};

type DashboardActionCenterProps = {
  notifications?: {
    verificationQueue: number;
    withdrawalManagement: number;
    disputeManagement: number;
    messagingOversight: number;
    securityCenter: number;
    deletionRequests: number;
    reportsCenter: number;
  };
};

function getActionTone(count: number) {
  if (count > 0) {
    return {
      wrapper:
        "border-amber-200 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20 dark:hover:border-amber-800 dark:hover:bg-amber-950/30",
      count:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      dot: "bg-amber-500",
    };
  }

  return {
    wrapper:
      "border-[#E4ECF7] bg-[#FBFDFF] hover:border-[#C5D5EE] hover:bg-[#F8FBFF] dark:border-[#2D3F55] dark:bg-[#16202E] dark:hover:border-[#3B536F] dark:hover:bg-[#1B2838]",
    count:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
  };
}

export default function DashboardActionCenter({
  notifications,
}: DashboardActionCenterProps) {
  const actions: ActionItem[] = [
    {
      href: "/admin/verification",
      label: "Verification Queue",
      description: "Review pending identity verification submissions.",
      count: notifications?.verificationQueue ?? 0,
    },
    {
      href: "/admin/finance/withdrawals",
      label: "Withdrawals",
      description: "Review withdrawal requests awaiting processing.",
      count: notifications?.withdrawalManagement ?? 0,
    },
    {
      href: "/admin/reports",
      label: "Reports Center",
      description: "Review reports that still require moderation.",
      count: notifications?.reportsCenter ?? 0,
    },
    {
      href: "/admin/disputes",
      label: "Dispute Management",
      description: "Review open platform disputes.",
      count: notifications?.disputeManagement ?? 0,
    },
    {
      href: "/admin/messaging",
      label: "Messaging Oversight",
      description: "Review conversations currently flagged for attention.",
      count: notifications?.messagingOversight ?? 0,
    },
    {
      href: "/admin/security",
      label: "Security Center",
      description: "Review security activity requiring attention.",
      count: notifications?.securityCenter ?? 0,
    },
    {
      href: "/admin/deletion-requests",
      label: "Deletion Requests",
      description: "Review account deletion requests and dependencies.",
      count: notifications?.deletionRequests ?? 0,
    },
  ];

  const outstanding = actions.reduce((total, action) => total + action.count, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#C5D5EE] bg-white shadow-[0_8px_32px_rgba(91,143,204,0.08)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      <div className="border-b border-[#E4ECF7] px-5 py-5 dark:border-[#2D3F55]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Action Center
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Outstanding operational work
            </h2>
            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Jump directly to admin areas with work requiring attention.
            </p>
          </div>

          <span
            className={[
              "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
              outstanding > 0
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
            ].join(" ")}
          >
            <span
              className={[
                "h-2 w-2 rounded-full",
                outstanding > 0 ? "bg-amber-500" : "bg-emerald-500",
              ].join(" ")}
            />
            {outstanding > 0
              ? `${outstanding.toLocaleString()} outstanding`
              : "No outstanding actions"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {actions.map((action) => {
          const tone = getActionTone(action.count);

          return (
            <Link
              key={action.href}
              href={action.href}
              className={[
                "group rounded-xl border p-4 transition",
                tone.wrapper,
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        tone.dot,
                      ].join(" ")}
                    />
                    <h3 className="truncate text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {action.label}
                    </h3>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                    {action.description}
                  </p>
                </div>

                <span
                  className={[
                    "inline-flex min-w-8 shrink-0 items-center justify-center rounded-full px-2 py-1 text-xs font-bold",
                    tone.count,
                  ].join(" ")}
                >
                  {action.count.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 text-xs font-semibold text-[#315F96] transition group-hover:translate-x-0.5 dark:text-[#8FC1F2]">
                Open queue →
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
