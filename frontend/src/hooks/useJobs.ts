import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Job {
  id: string;
  user_id: string;
  status: JobStatus;
  scraped_at: string;
  updated_at: string;
  company: string;
  location: string;
  description: string;
  job_url: string;
  application_url: string;
  failure_reason: string | null;
  screenshot_file_id: string | null;
  greenhouse_id: string;
  source_url: string;
  title: string;
}

export type JobStatus =
  | "NOT_STARTED"
  | "PROCESSING"
  | "SCREENSHOT_CAPTURED"
  | "READY_FOR_SUBMISSION"
  | "FAILED";

export interface PaginatedJobs {
  items: Job[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface JobFilters {
  company?: string;
  page?: number;
  size?: number;
}

export const JOBS_QUERY_KEY = ["jobs"] as const;

export function useJobs(filters: JobFilters = {}) {
  const params = new URLSearchParams();
  if (filters.company) params.set("company", filters.company);
  params.set("page", String(filters.page ?? 1));
  params.set("size", String(filters.size ?? 50));

  return useQuery({
    queryKey: [...JOBS_QUERY_KEY, filters],
    queryFn: () => api.get<PaginatedJobs>(`/api/scraper/jobs?${params}`),
    refetchInterval: false,
  });
}

interface ScrapeResponse {
  message: string;
  company: string;
  jobs_scraped: number;
}

export function useScrapeJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ company, limit = 15 }: { company: string; limit?: number }) =>
      api.post<ScrapeResponse>(`/api/scraper/scrape/${encodeURIComponent(company)}?limit=${limit}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => api.get<string[]>("/api/scraper/companies"),
  });
}
