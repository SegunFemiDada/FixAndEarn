// Path: apps/web/src/app/app/payment/return/page.tsx

import { Suspense } from "react";
import PaymentReturnContent from "./PaymentReturnContent";

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8FF] dark:bg-[#111827]">
      <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-6 py-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        Loading payment status...
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentReturnContent />
    </Suspense>
  );
}