//path: apps/web/src/components/ui/SafeHtml.tsx
"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

export default function SafeHtml({ html }: { html: string }) {
  const [sanitized, setSanitized] = useState("");

  useEffect(() => {
    setSanitized(DOMPurify.sanitize(html));
  }, [html]);

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}