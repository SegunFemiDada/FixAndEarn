//path: apps/web/src/app/support/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Support",
  description: "Get help using FixAndEarn.",
  path: "/support",
});

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Support Center</h1>
          <div className="mt-4 space-y-4 text-[#6B7C99] dark:text-[#8FA0BC]">
            <p>If you need assistance, please check our <Link href="/faq" className="text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline">FAQ</Link> first.</p>
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Common Issues</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="text-[#1A2B4A] dark:text-[#E8F0FA]">Verification problems</strong> – contact verification@fixandearn.com</li>
                <li><strong className="text-[#1A2B4A] dark:text-[#E8F0FA]">Payment issues</strong> – contact payments@fixandearn.com</li>
                <li><strong className="text-[#1A2B4A] dark:text-[#E8F0FA]">Account access</strong> – use &quot;Forgot password&quot; or contact support@fixandearn.com</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Contact Us</h2>
              <p>Email: <a href="mailto:support@fixandearn.com" className="text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline">support@fixandearn.com</a></p>
              <p className="mt-2">Or use our <Link href="/support/contact" className="text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline">contact form</Link>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}