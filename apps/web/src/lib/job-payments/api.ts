import apiClient from "@/lib/apiClient";

export async function getPaymentStatus(jobId: string) {
  const { data } = await apiClient.get(
    `/job-payments/status/${jobId}`,
  );

  return data;
}