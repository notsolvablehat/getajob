import { createFileRoute, redirect } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { isAuthenticated } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { useProfile, useResume } from "@/hooks/useProfile";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();

  const { data: resume, isLoading: resumeLoading } = useResume();

  return (
    <div style={{ background: "#0d0d0f", minHeight: "100vh" }}>
      <Navbar />

      <main className="mx-auto px-7 pb-20 pt-9" style={{ maxWidth: 820 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-[#ececec]">
            Profile
          </h1>
          <p className="mt-1 text-[13px] text-[#7a7a85]">
            Your information is used to auto-fill job applications.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Resume card */}
          <ResumeUpload resume={resume} isLoading={resumeLoading} />

          {/* Profile form card */}
          <div
            className="rounded-[14px] border border-white/[0.07] p-5"
            style={{ background: "#141416" }}
          >
            <h2 className="mb-1 text-[14px] font-semibold text-[#ececec]">
              Personal Details
            </h2>
            <p className="mb-5 text-[12px] text-[#7a7a85]">
              Fill out your details so the automation can complete application
              forms on your behalf.
            </p>

            {profileLoading ? (
              <ProfileSkeleton />
            ) : profileError &&
              (profileError as { status?: number }).status !== 404 ? (
              <div className="flex items-center gap-2 rounded-lg border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-[13px] text-[#f87171]">
                <AlertCircle size={14} />
                Failed to load profile. Please refresh.
              </div>
            ) : (
              <ProfileForm profile={profile} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      <Skeleton className="h-9 w-28 rounded-full" />
    </div>
  );
}
