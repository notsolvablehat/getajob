import { RefreshCw } from "lucide-react";
import type { Job, JobStatus } from "@/hooks/useJobs";
import { JobRow } from "@/components/dashboard/JobRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// ── Empty state ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  onScrapeClick: () => void;
}

export function EmptyState({ onScrapeClick }: EmptyStateProps) {
  return (
    <div
      className="relative flex flex-col items-center overflow-hidden rounded-[14px] border border-white/[0.07] pb-16 pt-[72px] text-center"
      style={{ background: "#141416" }}
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: 320,
          height: 200,
          background:
            "radial-gradient(ellipse at top, rgba(124,111,255,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Icon */}
      <div
        className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-[14px] border border-[rgba(124,111,255,0.15)]"
        style={{ background: "rgba(124,111,255,0.06)" }}
      >
        <svg
          width="26"
          height="26"
          fill="none"
          stroke="#7c6fff"
          strokeWidth="1.6"
          viewBox="0 0 24 24"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
          <line x1="9" y1="14" x2="13" y2="14" />
        </svg>
      </div>

      <h2 className="relative z-10 mb-2 text-[17px] font-semibold tracking-[-0.3px] text-[#ececec]">
        No jobs yet
      </h2>
      <p className="relative z-10 mb-7 max-w-[340px] text-[13px] leading-relaxed text-[#7a7a85]">
        Point GetaJob at a Greenhouse career page and it'll collect open roles
        for you in seconds. Then apply to all of them in one click.
      </p>

      <Button
        onClick={onScrapeClick}
        className="relative z-10 mb-10 gap-2 rounded-full bg-[#7c6fff] px-5 py-2.5 text-[14px] text-white hover:bg-[#8c7fff]"
        style={{ boxShadow: "0 4px 20px rgba(124,111,255,0.3)" }}
      >
        <RefreshCw size={15} />
        Scrape Jobs
      </Button>

      {/* How it works */}
      <div className="relative z-10 flex w-full max-w-[520px] items-start px-4">
        {[
          "Scrape jobs from a Greenhouse career page",
          "Automation fills each application form",
          "Screenshot captured as proof — nothing submitted",
        ].map((label, i) => (
          <div key={i} className="relative flex flex-1 flex-col items-center gap-2 px-3">
            {/* Connector lines */}
            {i < 2 && (
              <div
                className="absolute right-0 top-[14px] h-px bg-white/[0.11]"
                style={{ width: "calc(50% + 1px)", right: "-1px" }}
              />
            )}
            {i > 0 && (
              <div
                className="absolute left-0 top-[14px] h-px bg-white/[0.11]"
                style={{ width: "calc(50% + 1px)", left: "-1px" }}
              />
            )}
            <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.11] bg-[#212126] text-[11px] font-semibold text-[#7a7a85]">
              {i + 1}
            </div>
            <span className="text-center text-[11.5px] leading-[1.4] text-[#4a4a55]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton loading ─────────────────────────────────────────────────────────
const SKELETON_WIDTHS = [210, 170, 240, 190, 155, 200];

export function SkeletonList() {
  return (
    <div
      className="overflow-hidden rounded-[14px] border border-white/[0.07]"
      style={{ background: "#141416" }}
      role="list"
      aria-busy="true"
      aria-label="Loading jobs"
    >
      {SKELETON_WIDTHS.map((titleW, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-[18px] py-4 last:border-b-0"
          style={{ opacity: i >= 4 ? 1 - (i - 3) * 0.3 : 1 }}
        >
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-3.5" style={{ width: titleW }} />
              {i < 4 && <Skeleton className="h-[18px] w-[76px] rounded-full" />}
            </div>
            <Skeleton className="h-3" style={{ width: titleW * 0.65 }} />
          </div>
          {i < 4 && (
            <div className="flex gap-2">
              <Skeleton className="h-7 w-[58px] rounded-full" />
              <Skeleton className="h-7 w-[52px] rounded-full" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Populated list ───────────────────────────────────────────────────────────
interface JobListProps {
  jobs: Job[];
  applyingJobIds: Set<string>;
  onApply: (jobId: string) => void;
  filterStatus: JobStatus | "ALL";
  search: string;
}

export function JobList({
  jobs,
  applyingJobIds,
  onApply,
  filterStatus,
  search,
}: JobListProps) {
  const filtered = jobs.filter((job) => {
    const matchesStatus =
      filterStatus === "ALL" || job.status === filterStatus;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-[14px] border border-white/[0.07] py-16 text-[13px] text-[#7a7a85]"
        style={{ background: "#141416" }}
      >
        No results match your filter.
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[14px] border border-white/[0.07]"
      style={{ background: "#141416" }}
      role="list"
    >
      {filtered.map((job) => (
        <JobRow
          key={job.id}
          job={job}
          onApply={onApply}
          isApplying={applyingJobIds.has(job.id)}
        />
      ))}
    </div>
  );
}
