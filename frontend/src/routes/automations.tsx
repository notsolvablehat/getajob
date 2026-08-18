import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { useTaskStatus } from "@/hooks/useApply";
import { getTaskId, getTaskJobs, clearTask, type TaskJobStub } from "@/lib/taskStorage";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";

export const Route = createFileRoute("/automations")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" });
  },
  component: AutomationsPage,
});

// ── Lane config ──────────────────────────────────────────────────────────────
const LANES = [
  {
    key: "pending" as const,
    label: "Pending",
    icon: Clock,
    color: "#7a7a85",
    bg: "rgba(82,82,91,0.1)",
    border: "rgba(82,82,91,0.2)",
  },
  {
    key: "ongoing" as const,
    label: "In Progress",
    icon: Loader2,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.06)",
    border: "rgba(96,165,250,0.15)",
    animated: true,
  },
  {
    key: "passed" as const,
    label: "Passed",
    icon: CheckCircle2,
    color: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
  },
  {
    key: "failed" as const,
    label: "Failed",
    icon: XCircle,
    color: "#f87171",
    bg: "rgba(248,113,113,0.06)",
    border: "rgba(248,113,113,0.15)",
  },
];

function AutomationsPage() {
  const navigate = useNavigate();
  const taskId = getTaskId();

  // If no active task → redirect to dashboard
  useEffect(() => {
    if (!taskId) {
      navigate({ to: "/dashboard" });
    }
  }, [taskId, navigate]);

  const { data: status, isLoading } = useTaskStatus(taskId);
  const taskJobs = getTaskJobs();

  // Build a lookup map: job_id → stub
  const jobMap = new Map<string, TaskJobStub>(taskJobs.map((j) => [j.id, j]));

  // Auto-toast on completion
  useEffect(() => {
    if (status?.is_complete) {
      toast.success(
        `Automation complete — ${status.passed.length} passed, ${status.failed.length} failed.`,
      );
    }
  }, [status?.is_complete]);

  function handleClear() {
    clearTask();
    navigate({ to: "/dashboard" });
  }

  if (!taskId) return null;

  return (
    <div style={{ background: "#0d0d0f", minHeight: "100vh" }}>
      <Navbar />

      <main className="mx-auto max-w-[900px] px-6 pb-20 pt-9">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-1 text-[13px] text-[#7a7a85] hover:text-[#ececec]"
              >
                <ArrowLeft size={14} />
                Home
              </Link>
              <span className="text-[#4a4a55]">/</span>
              <span className="text-[13px] text-[#7a7a85]">Automations</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-[#ececec]">
              Live Automation
            </h1>
            <p className="mt-1 text-[13px] text-[#7a7a85]">
              Polling every 10 seconds.
              {status && !status.is_complete && (
                <span className="ml-1">
                  {status.pending.length + status.ongoing.length} job
                  {status.pending.length + status.ongoing.length !== 1 ? "s" : ""} remaining.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-[#7a7a85]" />
            ) : status?.is_complete ? (
              <span className="flex items-center gap-1.5 rounded-full bg-[rgba(52,211,153,0.1)] px-3 py-1 text-[12px] font-medium text-[#34d399]">
                <CheckCircle2 size={12} />
                Complete
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-[rgba(124,111,255,0.1)] px-3 py-1 text-[12px] font-medium text-[#7c6fff]">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#7c6fff]"
                  style={{ animation: "gaj-blink 1.4s ease-in-out infinite" }}
                />
                Running
              </span>
            )}

            {/* Clear button — always visible, prominent when complete */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              className={`h-[30px] gap-1.5 rounded-full px-3 text-[12px] ${
                status?.is_complete
                  ? "border-[#34d399]/30 bg-[rgba(52,211,153,0.08)] text-[#34d399] hover:bg-[rgba(52,211,153,0.15)]"
                  : "border-white/[0.11] bg-[#212126] text-[#7a7a85] hover:text-[#f87171]"
              }`}
            >
              <Trash2 size={12} />
              {status?.is_complete ? "Done & Clear" : "Cancel & Clear"}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {status && (
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-[12px] text-[#7a7a85]">
              <span>
                {status.passed.length + status.failed.length} / {status.total_jobs} processed
              </span>
              <span>
                {Math.round(
                  ((status.passed.length + status.failed.length) / Math.max(status.total_jobs, 1)) * 100,
                )}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[#7c6fff] transition-all duration-500"
                style={{
                  width: `${((status.passed.length + status.failed.length) / Math.max(status.total_jobs, 1)) * 100}%`,
                  boxShadow: "0 0 8px rgba(124,111,255,0.4)",
                }}
              />
            </div>
          </div>
        )}

        {/* Task ID badge */}
        <p className="mb-6 font-mono text-[11px] text-[#4a4a55]">
          Task{" "}
          <span className="text-[#7a7a85]">{taskId}</span>
        </p>

        {/* 4 lanes grid */}
        {isLoading && !status ? (
          <div className="flex items-center justify-center py-20 text-[#7a7a85]">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : status ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LANES.map(({ key, label, icon: Icon, color, bg, border, animated }) => {
              const ids: string[] = status[key];
              return (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-[14px] border p-4"
                  style={{ background: bg, borderColor: border }}
                >
                  {/* Lane header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        size={14}
                        style={{ color }}
                        className={animated ? "animate-spin" : ""}
                      />
                      <span className="text-[12px] font-semibold" style={{ color }}>
                        {label}
                      </span>
                    </div>
                    <span
                      className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                      style={{ background: bg, color, border: `1px solid ${border}` }}
                    >
                      {ids.length}
                    </span>
                  </div>

                  {/* Job chips */}
                  <div className="flex flex-col gap-1.5">
                    {ids.length === 0 ? (
                      <p className="text-[11px] text-[#4a4a55]">None yet</p>
                    ) : (
                      ids.map((id) => {
                        const stub = jobMap.get(id);
                        return (
                          <div
                            key={id}
                            className="flex flex-col rounded-[8px] border border-white/[0.07] bg-[#141416] px-2.5 py-2"
                          >
                            {stub ? (
                              <>
                                <span className="truncate text-[12px] font-medium text-[#ececec]">
                                  {stub.title}
                                </span>
                                <span className="text-[11px] text-[#7a7a85]">
                                  {stub.company}
                                </span>
                              </>
                            ) : (
                              <span className="font-mono text-[10px] text-[#4a4a55]">
                                {id.slice(0, 8)}…
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-20 text-[#7a7a85]">
            <Zap size={28} className="text-[#4a4a55]" />
            <p className="text-[14px]">No status available yet.</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes gaj-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
