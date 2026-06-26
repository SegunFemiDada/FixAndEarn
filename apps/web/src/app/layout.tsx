// Path: apps/web/src/app/layout.tsx
import "./globals.css";
import Providers from "./providers";
import PublicFooter from "@/components/layout/public-footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FixAndEarn",
  description: "Fix. Earn. Grow.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔧</text></svg>",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] text-[#1A2B4A] dark:text-[#E8F0FA] antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
            <PublicFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}