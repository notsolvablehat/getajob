import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { ScrapeModal } from "@/components/dashboard/ScrapeModal";
import { StatusStrip } from "@/components/dashboard/StatusStrip";
import {
  EmptyState,
  JobList,
  SkeletonList,
} from "@/components/dashboard/JobList";
import { useJobs, useScrapeJobs, type JobStatus } from "@/hooks/useJobs";
import { useApplySingle, useApplyAll, useTaskStatus } from "@/hooks/useApply";
import { useQueryClient } from "@tanstack/react-query";
import { JOBS_QUERY_KEY } from "@/hooks/useJobs";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: DashboardPage,
});

type FilterTab = "ALL" | JobStatus;

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "PROCESSING", label: "In Progress" },
  { key: "SCREENSHOT_CAPTURED", label: "Done" },
  { key: "FAILED", label: "Failed" },
];

function DashboardPage() {
  const queryClient = useQueryClient();

  // Modals & UI state
  const [scrapeOpen, setScrapeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");

  // Apply-all task tracking
  const [taskId, setTaskId] = useState<string | null>(null);
  const [applyingJobIds, setApplyingJobIds] = useState<Set<string>>(new Set());

  // Queries
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ size: 100 });
  const jobs = jobsData?.items ?? [];

  // Mutations
  const scrapeJobs = useScrapeJobs();
  const applySingle = useApplySingle();
  const applyAll = useApplyAll();

  // Poll apply-all task status
  const { data: taskStatus } = useTaskStatus(taskId);

  // When task completes, refresh jobs and clear task
  if (taskStatus?.is_complete && taskId) {
    setTaskId(null);
    queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    toast.success(
      `Apply-All complete: ${taskStatus.passed.length} succeeded, ${taskStatus.failed.length} failed.`,
    );
  }

  const isScraping = scrapeJobs.isPending;
  const isApplying = applyAll.isPending || (taskId !== null && !taskStatus?.is_complete);

  async function handleScrapeConfirm(company: string) {
    try {
      const result = await scrapeJobs.mutateAsync({ company });
      setScrapeOpen(false);
      toast.success(
        `Scraped ${result.jobs_scraped} jobs from ${result.company}!`,
      );
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Scrape failed.";
      toast.error(msg);
    }
  }

  async function handleApplySingle(jobId: string) {
    setApplyingJobIds((prev) => new Set(prev).add(jobId));
    try {
      const result = await applySingle.mutateAsync(jobId);
      if (result.status === "SCREENSHOT_CAPTURED") {
        toast.success("Application screenshot captured!");
      } else {
        toast.error(result.failure_reason ?? "Application failed.");
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Apply failed.";
      toast.error(msg);
    } finally {
      setApplyingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }

  async function handleApplyAll() {
    const eligibleIds = jobs
      .filter((j) => j.status === "NOT_STARTED" || j.status === "FAILED")
      .map((j) => j.id);

    if (eligibleIds.length === 0) {
      toast.info("No eligible jobs to apply to.");
      return;
    }

    try {
      const response = await applyAll.mutateAsync(eligibleIds);
      setTaskId(response.task_id);
      toast.info(
        `Started applying to ${eligibleIds.length} jobs in the background…`,
      );
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Apply-All failed.";
      toast.error(msg);
    }
  }

  const totalCount = jobsData?.total ?? 0;

  // Dashboard body based on state
  let body: React.ReactNode;

  if (isScraping) {
    // Scraping state
    body = (
      <>
        <StatusStrip jobCount={0} />
        <p className="mb-2 px-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#4a4a55] opacity-40">
          collecting…
        </p>
        <SkeletonList />
      </>
    );
  } else if (jobsLoading) {
    body = <SkeletonList />;
  } else if (jobs.length === 0) {
    // Empty state
    body = <EmptyState onScrapeClick={() => setScrapeOpen(true)} />;
  } else {
    // Populated state
    body = (
      <>
        {/* Apply-all progress strip */}
        {taskId && taskStatus && !taskStatus.is_complete && (
          <div className="mb-4 flex items-center justify-between rounded-[10px] border border-white/[0.11] bg-[#1a1a1d] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2 w-2 rounded-full bg-[#7c6fff]"
                style={{ animation: "gaj-blink 1.2s ease-in-out infinite" }}
              />
              <span className="text-[13px] text-[#ececec]">
                Applying to all jobs…
              </span>
            </div>
            <span className="text-[12px] text-[#7a7a85]">
              <strong className="text-[#ececec]">{taskStatus.passed.length + taskStatus.failed.length}</strong>
              {" "}/ {taskStatus.total_jobs} done
            </span>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[180px] max-w-[320px] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a55]"
            />
            <input
              type="text"
              placeholder="Search jobs or companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-white/[0.07] bg-[#1a1a1d] py-[7px] pl-9 pr-3.5 text-[13px] text-[#ececec] outline-none transition-colors placeholder:text-[#4a4a55] focus:border-[#7c6fff]/40 focus:bg-[#212126]"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-0.5 rounded-full border border-white/[0.07] bg-[#1a1a1d] p-[3px]">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterTab(key)}
                className={`rounded-full px-3.5 py-[5px] text-[12px] font-medium transition-colors duration-150 ${
                  filterTab === key
                    ? "border border-white/[0.11] bg-[#212126] text-[#ececec]"
                    : "bg-transparent text-[#7a7a85] hover:text-[#ececec]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List label */}
        <p className="mb-2 px-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#4a4a55]">
          {totalCount} result{totalCount !== 1 ? "s" : ""}
        </p>

        <JobList
          jobs={jobs}
          applyingJobIds={applyingJobIds}
          onApply={handleApplySingle}
          filterStatus={filterTab}
          search={search}
        />
      </>
    );
  }

  return (
    <div style={{ background: "#0d0d0f", minHeight: "100vh" }}>
      <Navbar
        onScrapeClick={() => setScrapeOpen(true)}
        onApplyAllClick={handleApplyAll}
        isScraping={isScraping}
        isApplying={isApplying}
        hasJobs={jobs.length > 0}
      />

      <main
        className="mx-auto px-7 pb-20 pt-9"
        style={{ maxWidth: 820 }}
      >
        {/* Page header */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-[#ececec]">
              Jobs
            </h1>
            <p className="mt-1 text-[13px] text-[#7a7a85]">
              Scraped from Greenhouse career pages. Automation-ready.
            </p>
          </div>

          {totalCount > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#1a1a1d] px-3 py-1 text-[12px] text-[#7a7a85]">
              <strong className="text-[#ececec] font-semibold">{totalCount}</strong>
              {" "}jobs collected
            </div>
          )}
        </div>

        {body}
      </main>

      <ScrapeModal
        open={scrapeOpen}
        onOpenChange={setScrapeOpen}
        onConfirm={handleScrapeConfirm}
        isLoading={isScraping}
      />

      <style>{`
        @keyframes gaj-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
