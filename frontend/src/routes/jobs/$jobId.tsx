import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  RefreshCw,
  AlertCircle,
  Image,
  Loader2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import { useJob, type JobStatus } from "@/hooks/useJobs";
import { useApplySingle } from "@/hooks/useApply";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export const Route = createFileRoute("/jobs/$jobId")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" });
  },
  component: JobDetailPage,
});

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; pillClass: string; dotClass: string; animated?: boolean }
> = {
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Sanitize and render HTML description ─────────────────────────────────────
function JobDescription({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "a", "span", "div",
      "blockquote", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });

  return (
    <div
      className="gaj-prose"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { data: job, isLoading, error } = useJob(jobId);
  const applySingle = useApplySingle();
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    if (!job) return;
    setApplying(true);
    try {
      const result = await applySingle.mutateAsync(job.id);
      if (result.status === "SCREENSHOT_CAPTURED") {
        toast.success("Screenshot captured!");
      } else {
        toast.error(result.failure_reason ?? "Application failed.");
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Apply failed.");
    } finally {
      setApplying(false);
    }
  }

  async function handleScreenshotClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!job?.screenshot_file_id) return;
    
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
    <div style={{ background: "#0d0d0f", minHeight: "100vh" }}>
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-white/[0.07] px-6"
        style={{
          background: "rgba(13,13,15,0.90)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-[13px] text-[#7a7a85] transition-colors hover:text-[#ececec]"
        >
          <ArrowLeft size={14} />
          Home
        </Link>

        {job && (
          <div className="flex items-center gap-2">
            {/* View Job */}
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[30px] items-center gap-1.5 rounded-full border border-white/[0.11] bg-[#212126] px-3 text-[12px] text-[#7a7a85] transition-colors hover:border-white/[0.2] hover:text-[#ececec]"
            >
              View Job
              <ExternalLink size={11} />
            </a>

            {/* Apply button */}
            {(job.status === "NOT_STARTED" || job.status === "FAILED") && (
              <Button
                size="sm"
                onClick={handleApply}
                disabled={applying}
                className="h-[30px] gap-1.5 rounded-full bg-[#7c6fff] px-3 text-[12px] text-white hover:bg-[#8c7fff]"
                style={{ boxShadow: "0 2px 10px rgba(124,111,255,0.25)" }}
              >
                {applying ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Play size={12} />
                )}
                {job.status === "FAILED" ? "Retry" : "Apply"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <main className="mx-auto max-w-[760px] px-6 py-10">
        {isLoading ? (
          <JobDetailSkeleton />
        ) : error || !job ? (
          <div className="flex flex-col items-center gap-3 pt-20 text-center text-[#7a7a85]">
            <AlertCircle size={28} className="text-[#f87171]" />
            <p className="text-[15px] font-medium text-[#ececec]">Job not found</p>
            <p className="text-[13px]">
              It may have been deleted or you followed an outdated link.
            </p>
            <Link to="/dashboard" className="mt-2 text-[13px] text-[#7c6fff] hover:underline">
              ← Back to Home
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              {/* Status pill */}
              {(() => {
                const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.NOT_STARTED;
                return (
                  <span
                    className={`mb-3 inline-flex items-center gap-[5px] rounded-full px-[10px] py-[3px] text-[11px] font-medium ${cfg.pillClass}`}
                  >
                    <span
                      className={`h-[5px] w-[5px] shrink-0 rounded-full ${cfg.dotClass}`}
                      style={cfg.animated ? { animation: "gaj-pulse 1.5s ease-in-out infinite" } : undefined}
                    />
                    {cfg.label}
                  </span>
                );
              })()}

              <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-[#ececec]">
                {job.title}
              </h1>

              {/* Meta row */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-[#7a7a85]">
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-[#4a4a55]" />
                  {job.company}
                </span>
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#4a4a55]" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-[#4a4a55]" />
                  Scraped {formatDate(job.scraped_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#4a4a55]" />
                  Updated {formatDate(job.updated_at)}
                </span>
              </div>

              {/* Failure reason */}
              {job.status === "FAILED" && job.failure_reason && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-[rgba(248,113,113,0.15)] bg-[rgba(248,113,113,0.06)] px-4 py-3 text-[13px] text-[#f87171]">
                  <AlertCircle size={14} className="mt-[1px] shrink-0" />
                  <span>{job.failure_reason}</span>
                </div>
              )}

              {/* Screenshot link */}
              {job.screenshot_file_id && (
                <div className="mt-4">
                  <button
                    onClick={handleScreenshotClick}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-[#1a1a1d] px-3 py-1.5 text-[12px] text-[#7a7a85] transition-colors hover:border-white/[0.18] hover:text-[#ececec]"
                  >
                    <Image size={12} />
                    View screenshot
                    <ExternalLink size={10} />
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mb-8 border-t border-white/[0.07]" />

            {/* Application URLs */}
            <div
              className="mb-8 flex flex-wrap gap-3 rounded-[12px] border border-white/[0.07] p-4"
              style={{ background: "#141416" }}
            >
              <div className="flex flex-1 flex-col gap-1 min-w-[200px]">
                <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-[#4a4a55]">
                  Job Page
                </p>
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[13px] text-[#7c6fff] hover:underline"
                >
                  {job.job_url}
                </a>
              </div>
              {job.application_url && job.application_url !== job.job_url && (
                <div className="flex flex-1 flex-col gap-1 min-w-[200px]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-[#4a4a55]">
                    Application URL
                  </p>
                  <a
                    href={job.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[13px] text-[#7c6fff] hover:underline"
                  >
                    {job.application_url}
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            {job.description ? (
              <>
                <h2 className="mb-4 text-[14px] font-semibold uppercase tracking-[0.07em] text-[#4a4a55]">
                  Job Description
                </h2>
                <div
                  className="rounded-[12px] border border-white/[0.07] p-6"
                  style={{ background: "#141416" }}
                >
                  <JobDescription html={job.description} />
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[#4a4a55]">No description available.</p>
            )}
          </>
        )}
      </main>

      {/* Prose styles + animations */}
      <style>{`
        .gaj-prose { color: #b0b0ba; font-size: 14px; line-height: 1.75; }
        .gaj-prose h1, .gaj-prose h2, .gaj-prose h3, .gaj-prose h4 {
          color: #ececec; font-weight: 600; margin: 1.4em 0 0.6em;
          line-height: 1.3; letter-spacing: -0.02em;
        }
        .gaj-prose h1 { font-size: 1.35em; }
        .gaj-prose h2 { font-size: 1.15em; }
        .gaj-prose h3 { font-size: 1em; }
        .gaj-prose p { margin: 0.85em 0; }
        .gaj-prose ul, .gaj-prose ol { padding-left: 1.4em; margin: 0.85em 0; }
        .gaj-prose li { margin: 0.3em 0; }
        .gaj-prose ul li { list-style-type: disc; }
        .gaj-prose ol li { list-style-type: decimal; }
        .gaj-prose strong, .gaj-prose b { color: #d8d8e0; font-weight: 600; }
        .gaj-prose em, .gaj-prose i { font-style: italic; }
        .gaj-prose a {
          color: #7c6fff; text-decoration: underline; text-decoration-color: rgba(124,111,255,0.35);
        }
        .gaj-prose a:hover { text-decoration-color: #7c6fff; }
        .gaj-prose code {
          font-size: 0.85em; background: rgba(124,111,255,0.1); color: #a78bfa;
          border-radius: 4px; padding: 0.1em 0.35em;
        }
        .gaj-prose pre {
          background: #1a1a1d; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 1em; overflow-x: auto; margin: 1em 0;
        }
        .gaj-prose pre code { background: none; padding: 0; color: #d8d8e0; }
        .gaj-prose blockquote {
          border-left: 3px solid rgba(124,111,255,0.4); padding-left: 1em;
          color: #7a7a85; margin: 1em 0;
        }
        @keyframes gaj-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function JobDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-5 w-28 rounded-full" />
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-4 border-t border-white/[0.07]" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    </div>
  );
}
