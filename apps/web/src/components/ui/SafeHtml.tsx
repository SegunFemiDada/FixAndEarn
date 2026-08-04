// path: apps/web/src/components/ui/SafeHtml.tsx
"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

export default function SafeHtml({ html }: { html: string }) {
  const [sanitized, setSanitized] = useState("");

  useEffect(() => {
    setSanitized(
      DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
      }),
    );
  }, [html]);

  return (
    <div
      className="
        prose
        prose-slate
        dark:prose-invert
        max-w-none

        text-justify

        prose-headings:text-[#1A2B4A]
        dark:prose-headings:text-[#E8F0FA]

        prose-p:text-[#4B5C77]
        dark:prose-p:text-[#C7D4E6]

        prose-li:text-[#4B5C77]
        dark:prose-li:text-[#C7D4E6]

        prose-strong:text-[#1A2B4A]
        dark:prose-strong:text-[#E8F0FA]

        prose-a:text-[#5B8FCC]
        dark:prose-a:text-[#7AAEE0]

        prose-ul:list-disc
        prose-ol:list-decimal

        prose-ul:pl-6
        prose-ol:pl-6

        prose-li:my-1

        prose-p:leading-7
        prose-li:leading-7

        prose-h1:mb-6
        prose-h2:mt-8
        prose-h2:mb-4
        prose-h3:mt-6
        prose-h3:mb-3
      "
      dangerouslySetInnerHTML={{
        __html: sanitized,
      }}
    />
  );
}