import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo/site";

type BuildMetadataArgs = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function buildPublicMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  noIndex = false,
}: BuildMetadataArgs): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}