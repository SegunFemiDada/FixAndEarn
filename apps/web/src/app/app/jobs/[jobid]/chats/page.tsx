// Path: apps/web/src/app/app/jobs/[jobid]/chats/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JobChatsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/chats");
  }, [router]);

  return null;
}