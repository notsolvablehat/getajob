import { useState } from "react";
import { ExternalLink, Image, AlertCircle, Loader2 } from "lucide-react";
import type { Job, JobStatus } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { ScreenshotModal } from "@/components/dashboard/ScreenshotModal";

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
  onApply?: (jobId: string) => void;
  isApplying?: boolean;
}

export function JobRow({ job, onApply, isApplying = false }: JobRowProps) {
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const config = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.NOT_STARTED;
  const isFailed = job.status === "FAILED";
  const isProcessing = job.status === "PROCESSING";
  const canApply = job.status === "NOT_STARTED" || job.status === "FAILED";

  return (
    <>
      <div
        className={`group flex items-center justify-between gap-4 border-b border-white/[0.07] px-[18px] py-[14px] transition-colors duration-100 last:border-b-0 ${
          isFailed
            ? "hover:bg-[rgba(248,113,113,0.03)]"
            : "hover:bg-[#1a1a1d]"
        }`}
      >
        {/* Left */}
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[500] tracking-[-0.1px] text-[#ececec]">
              {job.title}
            </span>

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

        {/* Right — hover reveal */}
        <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {/* Screenshot thumb */}
          {job.screenshot_file_id && (
            <button
              onClick={() => setScreenshotOpen(true)}
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

          {/* Apply / Retry button */}
          {canApply && (
            <Button
              size="sm"
              onClick={() => onApply?.(job.id)}
              disabled={isApplying || isProcessing}
              className={`h-[28px] rounded-full px-3 text-[12px] ${
                job.status === "NOT_STARTED"
                  ? "bg-[#7c6fff] text-white hover:bg-[#8c7fff]"
                  : "border border-white/[0.11] bg-[#212126] text-[#7a7a85] hover:bg-[#1a1a1d] hover:text-[#ececec]"
              }`}
              style={
                job.status === "NOT_STARTED"
                  ? { boxShadow: "0 2px 8px rgba(124,111,255,0.2)" }
                  : { boxShadow: "none" }
              }
            >
              {isApplying ? (
                <Loader2 size={11} className="animate-spin" />
              ) : job.status === "FAILED" ? (
                "Retry"
              ) : (
                "Apply"
              )}
            </Button>
          )}

          {isProcessing && (
            <Button
              size="sm"
              disabled
              className="h-[28px] rounded-full border border-white/[0.11] bg-[#212126] px-3 text-[12px] text-[#7a7a85] opacity-40"
              style={{ boxShadow: "none" }}
            >
              <Loader2 size={11} className="animate-spin" />
              Applying…
            </Button>
          )}
        </div>
      </div>

      <ScreenshotModal
        fileId={job.screenshot_file_id}
        jobTitle={job.title}
        open={screenshotOpen}
        onOpenChange={setScreenshotOpen}
      />

      <style>{`
        @keyframes gaj-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
  );
}
