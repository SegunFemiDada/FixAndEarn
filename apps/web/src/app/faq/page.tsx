//path: apps/web/src/app/faq/page.tsx
import type { Metadata } from "next";
import PublicContentShell from "@/components/content/public-content-shell";
import FaqAccordion from "@/components/content/faq-accordion";
import { getPublicFaq } from "@/lib/content/api";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "FAQ",
  description: "Frequently asked questions about FixAndEarn.",
  path: "/faq",
});

function SafeHtml({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default async function FaqPage() {
  const data = await getPublicFaq();

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <PublicContentShell
            eyebrow="FAQ"
            title={data.title || "FAQ"}
            description="Common questions about verification, jobs, payments, disputes, and platform usage."
          >
            {data.mode === "structured" && data.items.length > 0 ? (
              <FaqAccordion items={data.items} />
            ) : (
              <SafeHtml html={data.rawContent || ""} />
            )}
          </PublicContentShell>
        </div>
      </div>
    </div>
  );
}