//path: apps/web/src/app/privacy/page.tsx
import type { Metadata } from "next";
import PublicContentShell from "@/components/content/public-content-shell";
import { getPublicTextContent } from "@/lib/content/api";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import SafeHtml from "@/components/ui/SafeHtml";

export const metadata: Metadata = buildPublicMetadata({
  title: "FixAndEarn Privacy Policy",
  description:
    "Learn how FixAndEarn collects, uses, protects, and manages personal data and information when you use the platform.",
  path: "/privacy",
});

export default async function PrivacyPage() {
  const data = await getPublicTextContent("privacy");

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <PublicContentShell
            eyebrow="Privacy"
            title={data.title || "Privacy Policy"}
            description="This explains how FixAndEarn handles personal data and platform-related information."
          >
            <SafeHtml html={data.content || ""} />
          </PublicContentShell>
        </div>
      </div>
    </div>
  );
}