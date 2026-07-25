import { Suspense } from "react";
import PaymentReturnContent from "./PaymentReturnContent";

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Processing your payment...
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}