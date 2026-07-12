// Path: apps/web/src/app/layout.tsx
import "./globals.css";
import Providers from "./providers";
import PublicFooter from "@/components/layout/public-footer";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://fixandearn.com"),

  title: {
    default: "FixAndEarn",
    template: "%s | FixAndEarn",
  },

  description: "Fix. Earn. Grow.",

  applicationName: "FixAndEarn",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },

};
export const viewport: Viewport = {
  themeColor: "#2563eb",
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