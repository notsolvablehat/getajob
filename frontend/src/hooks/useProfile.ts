import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  location: string | null;
  bio: string | null;
  years_experience: number | null;
  skills: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  location?: string;
  bio?: string;
  years_experience?: number;
  skills?: string[];
}

export interface Resume {
  id: string;
  filename: string;
  appwrite_file_id: string;
  is_active: boolean;
  uploaded_at: string;
  download_url: string | null;
}

const PROFILE_KEY = ["profile"] as const;
const RESUME_KEY = ["resume"] as const;

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => api.get<CandidateProfile>("/api/candidate/profile"),
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 (profile not yet created)
      if ((error as { status?: number })?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdate) =>
      api.put<CandidateProfile>("/api/candidate/profile", data),
    onSuccess: (updated) => {
      queryClient.setQueryData(PROFILE_KEY, updated);
    },
  });
}

export function useResume() {
  return useQuery({
    queryKey: RESUME_KEY,
    queryFn: () => api.get<Resume>("/api/candidate/resume"),
    retry: (failureCount, error: unknown) => {
      if ((error as { status?: number })?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post<Resume>("/api/candidate/resume", formData);
    },
    onSuccess: (resume) => {
      queryClient.setQueryData(RESUME_KEY, resume);
    },
  });
}
