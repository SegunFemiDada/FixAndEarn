// path: apps/web/src/app/support/page.tsx

import type { Metadata } from "next";
import PublicContentShell from "@/components/content/public-content-shell";
import { getPublicTextContent } from "@/lib/content/api";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import SafeHtml from "@/components/ui/SafeHtml";

export const metadata: Metadata = buildPublicMetadata({
  title: "Support",
  description: "Get help using FixAndEarn.",
  path: "/support",
});

export default async function SupportPage() {
  const data = await getPublicTextContent("support");

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <PublicContentShell
            eyebrow="Support"
            title={data.title || "Support Center"}
            description="Need assistance? Our support team is here to help with your account, jobs, payments, verification, withdrawals, disputes, and other platform-related enquiries."
          >
            <SafeHtml html={data.content || ""} />
          </PublicContentShell>
        </div>
      </div>
    </div>
  );
}