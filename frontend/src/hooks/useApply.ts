import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { JOBS_QUERY_KEY } from "@/hooks/useJobs";

export interface ApplyResult {
  job_id: string;
  status: string;
  failure_reason: string | null;
  screenshot_url: string | null;
}

export interface ApplyAllStartResponse {
  task_id: string;
  message: string;
}

export interface TaskStatus {
  task_id: string;
  total_jobs: number;
  pending: string[];
  ongoing: string[];
  passed: string[];
  failed: string[];
  is_complete: boolean;
}

export function useApplySingle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      api.post<ApplyResult>(`/api/apply/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });
}

export function useApplyAll() {
  return useMutation({
    mutationFn: (jobIds: string[]) =>
      api.post<ApplyAllStartResponse>("/api/apply/all/start", {
        job_ids: jobIds,
      }),
  });
}

export function useTaskStatus(taskId: string | null) {
  return useQuery({
    queryKey: ["task-status", taskId],
    queryFn: () => api.get<TaskStatus>(`/api/apply/status/${taskId}`),
    enabled: taskId !== null,
    refetchInterval: (query) => {
      // Stop polling when task is complete
      if (query.state.data?.is_complete) return false;
      return 2000;
    },
  });
}
