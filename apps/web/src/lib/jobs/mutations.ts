import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJobRating } from "./api";

export function useCreateJobRating(jobId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { rating: number; review?: string }) =>
      createJobRating(jobId, data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
    }
  });
}