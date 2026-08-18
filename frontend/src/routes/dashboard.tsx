import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { ScrapeModal } from "@/components/dashboard/ScrapeModal";
import { StatusStrip } from "@/components/dashboard/StatusStrip";
import {
  EmptyState,
  JobList,
  SkeletonList,
} from "@/components/dashboard/JobList";
import { useJobs, useCompanies, useScrapeJobs, type JobStatus } from "@/hooks/useJobs";
import { useApplyAll } from "@/hooks/useApply";
import { setTask } from "@/lib/taskStorage";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/auth" });
  },
  component: DashboardPage,
});

type FilterStatus = JobStatus | "ALL";
type SortBy = "updated_at_desc" | "scraped_at_desc" | "updated_at_asc";

const STATUS_TABS: Array<{ key: FilterStatus; label: string }> = [
  { key: "ALL", label: "ALL" },
  { key: "NOT_STARTED", label: "NOT_STARTED" },
  { key: "PROCESSING", label: "PROCESSING" },
  { key: "SCREENSHOT_CAPTURED", label: "SCREENSHOT_CAPTURED" },
  { key: "READY_FOR_SUBMISSION", label: "READY_FOR_SUBMISSION" },
  { key: "FAILED", label: "FAILED" },
];

const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: "updated_at_desc", label: "Newest updated" },
  { value: "scraped_at_desc", label: "Newest scraped" },
  { value: "updated_at_asc", label: "Oldest updated" },
];

function DashboardPage() {
  const navigate = useNavigate();

  // Modals
  const [scrapeOpen, setScrapeOpen] = useState(false);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("updated_at_desc");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Reset page when filters change
  const handleFilterChange = () => setPage(1);

  // Selection mode

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Apply
  const [isAutomating, setIsAutomating] = useState(false);

  // Queries
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ page, size: 10, company: filterCompany });
  const { data: companies = [] } = useCompanies();
  const jobs = jobsData?.items ?? [];
  const totalCount = jobsData?.total ?? 0;
  const totalPages = jobsData?.pages ?? 1;

  const scrapeJobs = useScrapeJobs();
  const applyAll = useApplyAll();

  const isScraping = scrapeJobs.isPending;

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleScrapeConfirm(company: string) {
    try {
      const result = await scrapeJobs.mutateAsync({ company });
      setScrapeOpen(false);
      toast.success(`Scraped ${result.jobs_scraped} jobs from ${result.company}!`);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Scrape failed.");
    }
  }

  function handleEnterSelectionMode() {
    setSelectionMode(true);
    setSelectedIds(new Set());
  }

  function handleCancelSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  const handleToggleSelect = useCallback((jobId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else if (next.size < 5) {
        next.add(jobId);
      }
      return next;
    });
  }, []);

  async function handleAutomateSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsAutomating(true);
    try {
      const response = await applyAll.mutateAsync(ids);
      // Persist task + job stubs to localStorage
      const selectedJobs = jobs
        .filter((j) => ids.includes(j.id))
        .map((j) => ({ id: j.id, title: j.title, company: j.company }));
      setTask(response.task_id, selectedJobs);
      toast.success(`Automation started for ${ids.length} job${ids.length !== 1 ? "s" : ""}!`);
      // Navigate to automations page
      navigate({ to: "/automations" });
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Failed to start automation.");
    } finally {
      setIsAutomating(false);
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  }

  // ── Body content ─────────────────────────────────────────────────────────────

  let body: React.ReactNode;

  if (isScraping) {
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
    body = <EmptyState onScrapeClick={() => setScrapeOpen(true)} />;
  } else {
    body = (
      <>
        {/* Selection mode banner */}
        {selectionMode && (
          <div
            className="mb-4 flex items-center justify-between rounded-[10px] border border-[rgba(124,111,255,0.2)] bg-[rgba(124,111,255,0.06)] px-4 py-2.5"
          >
            <span className="text-[13px] text-[#ececec]">
              {selectedIds.size === 0
                ? "Click job rows to select (max 5)"
                : `${selectedIds.size} of 5 selected`}
            </span>
            <button
              onClick={handleCancelSelection}
              className="flex items-center gap-1 text-[12px] text-[#7a7a85] hover:text-[#ececec]"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-2.5">
          {/* Row 1: Search + filter toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[180px] max-w-[320px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a55]" />
              <input
                type="text"
                placeholder="Search jobs or companies…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange();
                }}
                className="w-full rounded-full border border-white/[0.07] bg-[#1a1a1d] py-[7px] pl-9 pr-3.5 text-[13px] text-[#ececec] outline-none transition-colors placeholder:text-[#4a4a55] focus:border-[#7c6fff]/40 focus:bg-[#212126]"
              />
            </div>

            {/* Status pills */}
            <div className="flex gap-0.5 rounded-full border border-white/[0.07] bg-[#1a1a1d] p-[3px]">
              {STATUS_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilterStatus(key);
                    handleFilterChange();
                  }}
                  className={`rounded-full px-3.5 py-[5px] text-[12px] font-medium transition-colors duration-150 ${
                    filterStatus === key
                      ? "border border-white/[0.11] bg-[#212126] text-[#ececec]"
                      : "bg-transparent text-[#7a7a85] hover:text-[#ececec]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setFiltersExpanded((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-[7px] text-[12px] font-medium transition-colors ${
                filtersExpanded || filterCompany || filterLocation || sortBy !== "updated_at_desc"
                  ? "border-[#7c6fff]/40 bg-[rgba(124,111,255,0.08)] text-[#7c6fff]"
                  : "border-white/[0.07] bg-[#1a1a1d] text-[#7a7a85] hover:text-[#ececec]"
              }`}
            >
              <SlidersHorizontal size={13} />
              Filters
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${filtersExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Row 2: Expanded filters */}
          {filtersExpanded && (
            <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-white/[0.07] bg-[#141416] px-4 py-3">
              {/* Company */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.07em] text-[#4a4a55]">
                  Company
                </label>
                <select
                  value={filterCompany}
                  onChange={(e) => {
                    setFilterCompany(e.target.value);
                    handleFilterChange();
                  }}
                  className="rounded-full border border-white/[0.07] bg-[#1a1a1d] px-3 py-[5px] text-[12px] text-[#ececec] outline-none focus:border-[#7c6fff]/40"
                >
                  <option value="">All companies</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.07em] text-[#4a4a55]">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote, SF"
                  value={filterLocation}
                  onChange={(e) => {
                    setFilterLocation(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-[160px] rounded-full border border-white/[0.07] bg-[#1a1a1d] px-3 py-[5px] text-[12px] text-[#ececec] outline-none placeholder:text-[#4a4a55] focus:border-[#7c6fff]/40"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.07em] text-[#4a4a55]">
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortBy);
                    handleFilterChange();
                  }}
                  className="rounded-full border border-white/[0.07] bg-[#1a1a1d] px-3 py-[5px] text-[12px] text-[#ececec] outline-none focus:border-[#7c6fff]/40"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear filters */}
              {(filterCompany || filterLocation || sortBy !== "updated_at_desc") && (
                <button
                  onClick={() => {
                    setFilterCompany("");
                    setFilterLocation("");
                    setSortBy("updated_at_desc");
                    handleFilterChange();
                  }}
                  className="ml-auto flex items-center gap-1 text-[12px] text-[#7a7a85] hover:text-[#f87171]"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* List label */}
        <p className="mb-2 px-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#4a4a55]">
          {totalCount} result{totalCount !== 1 ? "s" : ""}
        </p>

        <JobList
          jobs={jobs}
          filterStatus={filterStatus}
          search={search}
          filterCompany={filterCompany}
          filterLocation={filterLocation}
          sortBy={sortBy}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4 text-[13px]">
            <span className="text-[#7a7a85]">
              Page <strong className="text-[#ececec]">{page}</strong> of{" "}
              <strong className="text-[#ececec]">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 items-center justify-center rounded-full border border-white/[0.11] bg-[#212126] px-3 text-[#ececec] transition-colors hover:bg-[#1a1a1d] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 items-center justify-center rounded-full border border-white/[0.11] bg-[#212126] px-3 text-[#ececec] transition-colors hover:bg-[#1a1a1d] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ background: "#0d0d0f", minHeight: "100vh" }}>
      <Navbar
        onScrapeClick={() => setScrapeOpen(true)}
        isScraping={isScraping}
        hasJobs={jobs.length > 0}
        selectionMode={selectionMode}
        selectedCount={selectedIds.size}
        onEnterSelectionMode={handleEnterSelectionMode}
        onCancelSelection={handleCancelSelection}
        onAutomateSelected={handleAutomateSelected}
        isAutomating={isAutomating}
      />

      <main className="mx-auto px-7 pb-20 pt-9" style={{ maxWidth: 860 }}>
        {/* Page header */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.5px] text-[#ececec]">
              Jobs
            </h1>
            <p className="mt-1 text-[13px] text-[#7a7a85]">
              Scraped from Greenhouse career pages. Click a title to view details.
            </p>
          </div>

          {totalCount > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#1a1a1d] px-3 py-1 text-[12px] text-[#7a7a85]">
              <strong className="font-semibold text-[#ececec] tabular-nums">{totalCount}</strong>
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
    </div>
  );
}
