import "./globals.css";
import Providers from "./providers";
import PublicFooter from "@/components/layout/public-footer";
import type { Metadata, Viewport } from "next";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo/site";

const siteUrl = getSiteUrl();

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: siteUrl,
      logo: absoluteUrl("/icon.png"),
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: SITE_NAME,
      url: siteUrl,
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: "en-NG",
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "FixAndEarn | Hire Trusted Fixers in Nigeria",
    template: "%s | FixAndEarn",
  },

  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,

  authors: [
    {
      name: SITE_NAME,
      url: siteUrl,
    },
  ],

  creator: SITE_NAME,
  publisher: SITE_NAME,

  category: "Marketplace",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },

  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: SITE_NAME,
    title: "FixAndEarn | Hire Trusted Fixers in Nigeria",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "FixAndEarn | Hire Trusted Fixers in Nigeria",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "FixAndEarn | Hire Trusted Fixers in Nigeria",
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/opengraph-image")],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-NG">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </head>

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