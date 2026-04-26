//path: apps/web/src/app/terms/page.tsx
import type { Metadata } from "next";
import PublicContentShell from "@/components/content/public-content-shell";
import { getPublicTextContent } from "@/lib/content/api";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import SafeHtml from "@/components/ui/SafeHtml";

export const metadata: Metadata = buildPublicMetadata({
  title: "Terms of Service",
  description: "Read the FixAndEarn terms of service.",
  path: "/terms",
});

export default async function TermsPage() {
  const data = await getPublicTextContent("terms");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <PublicContentShell
            eyebrow="Legal"
            title={data.title || "Terms of Service"}
            description="These are the current terms governing use of the FixAndEarn platform."
          >
            <SafeHtml html={data.content || ""} />
          </PublicContentShell>
        </div>
      </div>
    </div>
  );
}