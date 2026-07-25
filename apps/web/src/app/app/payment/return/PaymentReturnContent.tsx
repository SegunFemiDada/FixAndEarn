"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const jobId = searchParams.get("jobId");
  const type = searchParams.get("type");

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkPayment() {
      if (!jobId) return;

      // your existing polling logic
    }

    checkPayment();
  }, [jobId]);

  return (
    <div>
      {/* your existing UI */}
    </div>
  );
}