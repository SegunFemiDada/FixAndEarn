//path: apps/web/src/components/layout/public-footer.tsx
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            FixAndEarn
          </p>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Verified skilled workers. Secure job flow. Built for Nigeria.
          </p>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          <Link
            href="/terms"
            className="hover:text-[#5B8FCC] dark:hover:text-[#7AAEE0] transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="hover:text-[#5B8FCC] dark:hover:text-[#7AAEE0] transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/faq"
            className="hover:text-[#5B8FCC] dark:hover:text-[#7AAEE0] transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/support"
            className="hover:text-[#5B8FCC] dark:hover:text-[#7AAEE0] transition-colors"
          >
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}