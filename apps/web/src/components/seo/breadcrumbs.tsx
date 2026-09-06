import Link from "next/link";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";

type BreadcrumbsProps = {
  current: string;
  currentPath: string;
};

export default function Breadcrumbs({
  current,
  currentPath,
}: BreadcrumbsProps) {
  const items = [
    {
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    {
      name: current,
      url: absoluteUrl(currentPath),
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-6"
      >
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          <li>
            <Link
              href="/"
              className="font-medium text-[#5B8FCC] transition hover:underline dark:text-[#7AAEE0]"
            >
              {SITE_NAME}
            </Link>
          </li>

          <li
            aria-hidden="true"
            className="text-[#8FA0BC]"
          >
            /
          </li>

          <li
            aria-current="page"
            className="font-medium text-[#6B7C99] dark:text-[#8FA0BC]"
          >
            {current}
          </li>
        </ol>
      </nav>
    </>
  );
}