import { ExternalLink, AlertCircle, Image } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Job, JobStatus } from "@/hooks/useJobs";
import { api } from "@/lib/api";

interface StatusConfig {
  label: string;
  pillClass: string;
  dotClass: string;
  animated?: boolean;
}

const STATUS_CONFIG: Record<JobStatus, StatusConfig> = {
  SCREENSHOT_CAPTURED: {
    label: "Screenshot Captured",
    pillClass: "bg-[rgba(52,211,153,0.10)] text-[#34d399]",
    dotClass: "bg-[#34d399]",
  },
  READY_FOR_SUBMISSION: {
    label: "Ready for Submission",
    pillClass: "bg-[rgba(124,111,255,0.12)] text-[#7c6fff]",
    dotClass: "bg-[#7c6fff]",
  },
  PROCESSING: {
    label: "Processing",
    pillClass: "bg-[rgba(96,165,250,0.10)] text-[#60a5fa]",
    dotClass: "bg-[#60a5fa]",
    animated: true,
  },
  FAILED: {
    label: "Failed",
    pillClass: "bg-[rgba(248,113,113,0.10)] text-[#f87171]",
    dotClass: "bg-[#f87171]",
  },
  NOT_STARTED: {
    label: "Not Started",
    pillClass: "bg-[rgba(82,82,91,0.15)] text-[#4a4a55]",
    dotClass: "bg-[#52525b]",
  },
};


interface JobRowProps {
  job: Job;
  // Selection mode
  selectionMode?: boolean;
  selected?: boolean;
  selectionDisabled?: boolean; // true when max (5) already selected and this row isn't one
  onToggle?: (jobId: string) => void;
}

export function JobRow({
  job,
  selectionMode = false,
  selected = false,
  selectionDisabled = false,
  onToggle,
}: JobRowProps) {
  const config = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.NOT_STARTED;
  const isFailed = job.status === "FAILED";
  const navigate = useNavigate();

  function handleRowClick(e: React.MouseEvent) {
    // Prevent triggering if clicking an internal link/button
    if ((e.target as HTMLElement).closest("a, button, input")) return;
    
    if (selectionMode) {
      if (!selectionDisabled || selected) {
        onToggle?.(job.id);
      }
    } else {
      navigate({ to: "/jobs/$jobId", params: { jobId: job.id } });
    }
  }

  async function handleScreenshotClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!job.screenshot_file_id) return;
    
    const toastId = toast.loading("Opening screenshot...");
    try {
      const blob = await api.downloadFile(`/api/apply/screenshot/${job.screenshot_file_id}`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.dismiss(toastId);
    } catch {
      toast.error("Failed to load screenshot", { id: toastId });
    }
  }

  return (
    <div
      onClick={handleRowClick}
      className={`group flex items-center justify-between gap-4 border-b border-white/[0.07] px-[18px] py-[14px] transition-colors duration-100 last:border-b-0 cursor-pointer ${
        selected
          ? "bg-[rgba(124,111,255,0.06)]"
          : isFailed
          ? "hover:bg-[rgba(248,113,113,0.03)]"
          : "hover:bg-[#1a1a1d]"
      }`}
    >
      {/* Checkbox (selection mode only) */}
      {selectionMode && (
        <label className="flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={selected}
            disabled={selectionDisabled && !selected}
            onChange={() => onToggle?.(job.id)}
            className="sr-only"
          />
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-100 ${
              selected
                ? "border-[#7c6fff] bg-[#7c6fff]"
                : selectionDisabled
                ? "border-white/[0.07] bg-white/[0.02] opacity-35"
                : "border-white/[0.18] bg-transparent hover:border-[#7c6fff]/60"
            }`}
          >
            {selected && (
              <svg width="10" height="8" fill="none" viewBox="0 0 10 8">
                <path
                  d="M1 4l2.5 2.5L9 1"
                  stroke="#fff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </label>
      )}

      {/* Left */}
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        {/* Title row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/jobs/$jobId"
            params={{ jobId: job.id }}
            className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[500] tracking-[-0.1px] text-[#ececec] hover:text-[#7c6fff] hover:underline"
          >
            {job.title}
          </Link>

          {/* Status pill */}
          <span
            className={`inline-flex shrink-0 items-center gap-[5px] rounded-full px-[9px] py-[2px] text-[11px] font-[500] ${config.pillClass}`}
          >
            <span
              className={`h-[5px] w-[5px] shrink-0 rounded-full ${config.dotClass}`}
              style={
                config.animated
                  ? { animation: "gaj-pulse 1.5s ease-in-out infinite" }
                  : undefined
              }
            />
            {config.label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-[6px] text-[12px] text-[#7a7a85]">
          <span>{job.company}</span>
          {job.location && (
            <>
              <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-[#4a4a55]" />
              <span>{job.location}</span>
            </>
          )}
        </div>

        {/* Failure reason */}
        {isFailed && job.failure_reason && (
          <div className="mt-0.5 flex items-center gap-[5px] text-[11.5px] text-[#f87171] opacity-75">
            <AlertCircle size={11} />
            {job.failure_reason}
          </div>
        )}
      </div>

      {/* Right — hover reveal (hidden in selection mode) */}
      {!selectionMode && (
        <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {/* Screenshot link */}
          {job.screenshot_file_id && (
            <button
              onClick={handleScreenshotClick}
              title="View screenshot"
              className="flex h-[22px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-white/[0.11] bg-[#212126] transition-colors hover:border-[#7c6fff] hover:bg-[rgba(124,111,255,0.12)]"
            >
              <Image
                size={12}
                className="text-[#4a4a55] transition-colors hover:text-[#7c6fff]"
              />
            </button>
          )}

          {/* View Job */}
          <a
            href={job.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-transparent px-[10px] py-[5px] text-[12px] text-[#7a7a85] transition-colors hover:border-white/[0.15] hover:bg-[#212126] hover:text-[#ececec]"
          >
            View Job
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      <style>{`
        @keyframes gaj-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
