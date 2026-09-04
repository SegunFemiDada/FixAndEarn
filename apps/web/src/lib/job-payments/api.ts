//path: apps/web/src/lib/job-payments/api.ts
import apiClient from "@/lib/apiClient";

export async function verifyPayment(
  paymentReference: string,
) {
  const { data } = await apiClient.post(
    "/job-payments/verify",
    {
      paymentReference,
    },
  );

  return data;
}

export async function getPaymentStatus(jobId: string) {
  const { data } = await apiClient.get(
    `/job-payments/status/${jobId}`,
  );
  return data;
}

export async function continuePostingPayment(jobId: string) {
  const { data } = await apiClient.post(
    `/job-payments/continue/${jobId}`,
  );
  return data;
}

export async function deleteDraftJob(jobId: string) {
  const { data } = await apiClient.delete(
    `/jobs/${jobId}`,
  );
  return data;
}