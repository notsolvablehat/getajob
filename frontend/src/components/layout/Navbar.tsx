import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutGrid,
  User,
  Zap,
  RefreshCw,
  Loader2,
  LogOut,
  UserCircle,
  CheckSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/auth";
import { getTaskId } from "@/lib/taskStorage";
import { useState, useRef, useEffect } from "react";

interface NavbarProps {
  // Scrape
  onScrapeClick?: () => void;
  isScraping?: boolean;
  // Selection / automate flow
  hasJobs?: boolean;
  selectionMode?: boolean;
  selectedCount?: number;
  onEnterSelectionMode?: () => void;
  onCancelSelection?: () => void;
  onAutomateSelected?: () => void;
  isAutomating?: boolean;
}

const BASE_NAV = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutGrid },
  { to: "/profile" as const, label: "Profile", icon: User },
];

export function Navbar({
  onScrapeClick,
  isScraping = false,
  hasJobs = false,
  selectionMode = false,
  selectedCount = 0,
  onEnterSelectionMode,
  onCancelSelection,
  onAutomateSelected,
  isAutomating = false,
}: NavbarProps) {
  const location = useLocation();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if there's an active automation task in localStorage
  const [hasActiveTask, setHasActiveTask] = useState(false);
  useEffect(() => {
    setHasActiveTask(!!getTaskId());
    // Re-check on storage events (other tabs)
    const handler = () => setHasActiveTask(!!getTaskId());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  function handleLogout() {
    clearToken();
    window.location.href = "/auth";
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    if (avatarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarOpen]);

  // Button config based on selection state
  const actionButton = (() => {
    if (!hasJobs || !onEnterSelectionMode) return null;

    if (!selectionMode) {
      return (
        <Button
          size="sm"
          onClick={onEnterSelectionMode}
          disabled={isScraping}
          className="h-[30px] gap-1.5 rounded-full bg-[#7c6fff] px-3 text-[12px] text-white hover:bg-[#8c7fff] disabled:opacity-40"
          style={{ boxShadow: "0 2px 12px rgba(124,111,255,0.25)" }}
        >
          <CheckSquare size={12} />
          Apply to All
        </Button>
      );
    }

    if (selectedCount === 0) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#7a7a85]">Select up to 5 jobs</span>
          <button
            onClick={onCancelSelection}
            className="flex h-[30px] items-center gap-1 rounded-full border border-white/[0.11] bg-[#212126] px-2.5 text-[12px] text-[#7a7a85] hover:text-[#ececec]"
          >
            <X size={12} />
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onAutomateSelected}
          disabled={isAutomating}
          className="h-[30px] gap-1.5 rounded-full bg-[#7c6fff] px-3 text-[12px] text-white hover:bg-[#8c7fff]"
          style={{ boxShadow: "0 2px 12px rgba(124,111,255,0.25)" }}
        >
          {isAutomating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Zap size={12} />
          )}
          Automate {selectedCount} Job{selectedCount !== 1 ? "s" : ""}
        </Button>
        <button
          onClick={onCancelSelection}
          className="flex h-[30px] items-center gap-1 rounded-full border border-white/[0.11] bg-[#212126] px-2.5 text-[12px] text-[#7a7a85] hover:text-[#ececec]"
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    );
  })();

  return (
    <nav
      className="sticky top-0 z-50 flex h-14 items-center gap-8 border-b border-white/[0.07] px-7"
      style={{
        background: "rgba(13,13,15,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex shrink-0 items-center gap-2">
        <div
          className="h-[7px] w-[7px] rounded-full bg-[#7c6fff]"
          style={{ boxShadow: "0 0 8px rgba(124,111,255,0.4)" }}
        />
        <span className="text-[15px] font-semibold tracking-tight text-[#ececec]">
          GetaJob
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex flex-1 items-center gap-1">
        {BASE_NAV.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-[450] transition-colors duration-150 ${
                isActive
                  ? "bg-[#212126] text-[#ececec]"
                  : "text-[#7a7a85] hover:bg-[#212126] hover:text-[#ececec]"
              }`}
            >
              <Icon size={14} className={isActive ? "opacity-100" : "opacity-60"} />
              {label}
            </Link>
          );
        })}

        {/* Automations tab */}
        {hasActiveTask ? (
          <Link
            to="/automations"
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-[450] transition-colors duration-150 ${
              location.pathname === "/automations"
                ? "bg-[#212126] text-[#ececec]"
                : "text-[#7a7a85] hover:bg-[#212126] hover:text-[#ececec]"
            }`}
          >
            <Zap size={14} className="opacity-80" />
            Automations
            {/* Live pulse badge */}
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#7c6fff]"
              style={{ animation: "gaj-blink 1.4s ease-in-out infinite" }}
            />
          </Link>
        ) : (
          <div className="relative group">
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-[450] text-[#4a4a55] opacity-50"
            >
              <Zap size={14} className="opacity-60" />
              Automations
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#1a1a1d] px-2.5 py-1 text-[11px] text-[#7a7a85] opacity-0 transition-opacity group-hover:opacity-100">
              No automation is currently running
            </div>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        {/* Scrape Jobs */}
        {onScrapeClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onScrapeClick}
            disabled={isScraping || selectionMode}
            className="h-[30px] gap-1.5 rounded-full border-white/[0.11] bg-[#212126] px-3 text-[12px] text-[#7a7a85] hover:bg-[#1a1a1d] hover:text-[#ececec] disabled:opacity-40"
          >
            {isScraping ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            {isScraping ? "Scraping…" : "Scrape Jobs"}
          </Button>
        )}

        {/* Dynamic action button */}
        {actionButton}

        {/* Avatar + dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setAvatarOpen((v) => !v)}
            className="flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full text-[12px] font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #7c6fff, #a78bfa)" }}
            title="Account"
          >
            A
          </button>

          {avatarOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden rounded-[10px] border border-white/[0.07] py-1"
              style={{ background: "#1a1a1d" }}
            >
              <Link
                to="/profile"
                onClick={() => setAvatarOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#7a7a85] transition-colors hover:bg-[#212126] hover:text-[#ececec]"
              >
                <UserCircle size={14} />
                Profile
              </Link>
              <div className="my-1 border-t border-white/[0.07]" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[#f87171] transition-colors hover:bg-[rgba(248,113,113,0.08)]"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gaj-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </nav>
  );
}
