// Path: apps/web/src/lib/jobs/applications-api.ts
import apiClient from "@/lib/apiClient";

export type JobApplicant = {
  fixerId: string;
  fixer: { id: string; fullName: string; email: string } | null;
  note: string | null;
  status: string;
  createdAt: string;
};

export type JobApplicationsResponse = {
  jobId: string;
  total: number;
  skip: number;
  take: number;
  applications: JobApplicant[];
};

export async function listJobApplications(
  jobId: string,
  params?: { skip?: number; take?: number }
): Promise<JobApplicationsResponse> {
  const res = await apiClient.get(`/jobs/${jobId}/applications`, { params });
  return res.data;
}
